import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { fulfilPurchase } from "@/lib/fulfil";

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

  if (!kind || !referenceId) {
    return NextResponse.json({ received: true, note: "no metadata" });
  }

  const result = await fulfilPurchase({ kind, referenceId, buyerId, dodoPaymentId: paymentId });
  return NextResponse.json({ received: true, ...result });
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
