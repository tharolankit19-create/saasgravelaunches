import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { fulfilPurchase } from "@/lib/fulfil";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dodo Payments webhook.
 *
 * The signature is verified before the payload is trusted — this endpoint
 * grants paid placements, so an unverified POST to it is free advertising for
 * whoever finds the URL. If `DODO_WEBHOOK_SECRET` isn't set we refuse rather
 * than fall open; the post-checkout success page still reconciles the purchase,
 * so a missing secret degrades timing, not correctness.
 *
 * Fulfilment is idempotent, so Dodo's retries are harmless.
 */
export async function POST(req: Request) {
  const raw = await req.text();

  const secret = process.env.DODO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("dodo webhook: DODO_WEBHOOK_SECRET is not set — refusing to fulfil.");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }
  if (!verify(req, raw, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const type: string = event?.type || event?.event_type || "";
  const succeeded =
    type.includes("succeeded") || type.includes("completed") || type === "payment.paid";
  if (!succeeded) return NextResponse.json({ received: true });

  const data = event?.data?.object || event?.data || event;
  const metadata = data?.metadata || {};

  const kind = metadata.kind as string | undefined;
  const referenceId = metadata.reference_id as string | undefined;
  const buyerId = metadata.user_id as string | undefined;
  const paymentId = data?.payment_id || data?.id;
  const subscriptionId = data?.subscription_id || data?.subscription?.id;

  // ── no-login directory-blast order ──
  // The hosted payment link carries the order's token as metadata. Match it and
  // flip the order to "paid" — no user, no reference_id, so this is handled
  // before the logged-in fulfilment path.
  const orderToken = (metadata.order_token || metadata.orderToken) as string | undefined;
  if (kind === "directory_order" || orderToken) {
    if (!orderToken) {
      return NextResponse.json({ received: true, note: "directory order without token" });
    }
    const res = await markDirectoryOrderPaid(orderToken, paymentId);
    return NextResponse.json({ received: true, ...res });
  }

  // ── no-login Spotlight bid (pay to rank) ──
  const bidToken = (metadata.bid_token || metadata.bidToken) as string | undefined;
  if (kind === "outbid" || bidToken) {
    if (!bidToken) {
      return NextResponse.json({ received: true, note: "bid without token" });
    }
    // Trust what Dodo says was actually paid, not what the checkout link asked
    // for — the amount is what buys the rank, so it must be the real charge.
    const paidCents = firstPositive([
      data?.total_amount,
      data?.amount,
      data?.subtotal_amount,
      data?.settlement_amount,
    ]);
    const res = await activateBid(bidToken, paidCents, paymentId);
    return NextResponse.json({ received: true, ...res });
  }

  if (!kind || !referenceId) {
    return NextResponse.json({ received: true, note: "no metadata" });
  }

  const result = await fulfilPurchase({
    kind,
    referenceId,
    buyerId,
    dodoPaymentId: paymentId,
    dodoSubscriptionId: subscriptionId,
  });
  return NextResponse.json({ received: true, ...result });
}

/**
 * Confirm payment on a no-login directory order.
 *
 * Idempotent by design — Dodo retries, and the buyer may already be further
 * along. We only ever advance a fresh order (received / on_hold) to "paid";
 * an order the operator has already moved to in_progress or completed is left
 * exactly where it is. The payment id is recorded either way.
 */
async function markDirectoryOrderPaid(token: string, paymentId?: string) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { note: "no service role" };
  }

  const { data: order } = await admin
    .from("launch_directory_orders")
    .select("id, status")
    .eq("public_token", token)
    .single();
  if (!order) return { note: "order not found" };

  const patch: Record<string, unknown> = {};
  if (paymentId) patch.dodo_payment_id = paymentId;
  if (order.status === "received" || order.status === "on_hold") {
    patch.status = "paid";
    patch.live_note =
      "Payment confirmed — you're in the queue. We'll start submitting your product shortly.";
  }
  if (Object.keys(patch).length === 0) return { orderId: order.id, status: order.status };

  await admin.from("launch_directory_orders").update(patch).eq("id", order.id);
  return { orderId: order.id, status: (patch.status as string) || order.status };
}

/** First finite, positive number in the list, or undefined. */
function firstPositive(vals: any[]): number | undefined {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

/**
 * Confirm a Spotlight bid and put it on the board.
 *
 * Sets the row live with a 24-hour clock, and pins the amount to what Dodo
 * actually charged (falling back to the requested amount only if the event
 * omits it). Idempotent: a Dodo retry that lands on an already-active row just
 * re-stamps the payment id; it never resets the clock backwards.
 */
async function activateBid(token: string, paidCents?: number, paymentId?: string) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { note: "no service role" };
  }

  const { data: bid } = await admin
    .from("launch_bids")
    .select("id, status, amount_cents")
    .eq("public_token", token)
    .single();
  if (!bid) return { note: "bid not found" };

  const patch: Record<string, unknown> = {};
  if (paymentId) patch.dodo_payment_id = paymentId;

  if (bid.status === "pending") {
    const now = new Date();
    patch.status = "active";
    patch.activated_at = now.toISOString();
    patch.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    if (paidCents && paidCents > 0) patch.amount_cents = paidCents;
  }

  if (Object.keys(patch).length === 0) return { bidId: bid.id, status: bid.status };
  await admin.from("launch_bids").update(patch).eq("id", bid.id);
  return { bidId: bid.id, status: (patch.status as string) || bid.status };
}

/**
 * Standard Webhooks verification (the scheme Dodo uses).
 *
 * Signs `id.timestamp.body` with the base64 secret, compares in constant time
 * against every signature in the header, and rejects anything older than five
 * minutes so a captured request can't be replayed later.
 */
function verify(req: Request, body: string, secret: string): boolean {
  const id = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signatureHeader = req.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key.length ? key : Buffer.from(secret))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  // Header format: "v1,<sig> v1,<sig>" — any one matching is enough.
  return signatureHeader
    .split(" ")
    .map((part) => part.split(",").pop() || "")
    .some((sig) => {
      if (sig.length !== expected.length) return false;
      try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
      } catch {
        return false;
      }
    });
}
