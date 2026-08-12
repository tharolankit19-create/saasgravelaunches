import { NextResponse } from "next/server";
import { createAdminClient, currentUser } from "@/lib/supabase/server";
import { createDodoCheckout } from "@/lib/dodo";
import { claimSlot } from "@/lib/ads";
import {
  isProductKey,
  kindFor,
  productCents,
  productDodoId,
  productEnvName,
  PRODUCTS,
} from "@/lib/pricing";
import { monthKey } from "@/lib/week";

export const dynamic = "force-dynamic";

/**
 * Start a purchase.
 *
 * The client sends a product key and nothing else. Every number — the price,
 * the Dodo product, what's being bought — is resolved here from the
 * catalogue, so there's no amount in the request for anyone to edit.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { product, productSlug } = await request.json().catch(() => ({ product: null }));
  if (!isProductKey(product)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const spec = PRODUCTS[product];
  const kind = kindFor(product);
  const origin = new URL(request.url).origin;
  const admin = createAdminClient();

  // ── what exactly is being bought ──
  let referenceId: string;

  if (spec.placement) {
    const claimed = await claimSlot(spec.placement, user.id);
    if (!claimed) {
      return NextResponse.json(
        { error: `Every ${spec.name} is booked for ${monthKey()}. Try next month.` },
        { status: 409 }
      );
    }
    referenceId = claimed.id;
  } else {
    // Premium applies to one of the buyer's own products.
    let query = admin
      .from("launch_products")
      .select("id, verified")
      .eq("maker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (typeof productSlug === "string" && productSlug) query = query.eq("slug", productSlug);

    const { data } = await query;
    const target = data?.[0];
    if (!target) {
      return NextResponse.json(
        { error: "Launch a product first — Premium upgrades a listing you already have." },
        { status: 400 }
      );
    }
    if (target.verified) {
      return NextResponse.json({ error: "That listing is already Premium." }, { status: 409 });
    }
    referenceId = target.id;
  }

  // Best-effort ledger row. Never blocks checkout — the webhook and the
  // success page both reconcile afterwards.
  let paymentId: string | null = null;
  try {
    const { data } = await admin
      .from("launch_payments")
      .insert({
        user_id: user.id,
        kind,
        reference_id: referenceId,
        amount_cents: productCents(product),
        status: "pending",
      })
      .select("id")
      .single();
    paymentId = data?.id ?? null;
  } catch (e: any) {
    console.error("checkout: ledger insert failed (continuing):", e?.message || e);
  }

  const params = new URLSearchParams({ kind, ref: referenceId });
  if (paymentId) params.set("p", paymentId);

  try {
    const url = await createDodoCheckout({
      kind,
      referenceId,
      userId: user.id,
      email: user.email,
      successUrl: `${origin}/checkout/success?${params.toString()}`,
      productId: productDodoId(product),
      productEnvName: productEnvName(product),
    });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Checkout couldn't start." }, { status: 502 });
  }
}
