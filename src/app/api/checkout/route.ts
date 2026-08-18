import { NextResponse } from "next/server";
import { createAdminClient, currentUser } from "@/lib/supabase/server";
import { createDodoCheckout } from "@/lib/dodo";
import { claimSlot, getFeaturedAvailability } from "@/lib/ads";
import { isPremium } from "@/lib/premium";
import {
  isProductKey,
  kindFor,
  productCents,
  productDodoId,
  productEnvName,
  PRODUCTS,
} from "@/lib/pricing";
import { currentWeekKey, monthKey, weekLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

/**
 * Start a purchase.
 *
 * The client sends a product key and, for product-scoped upgrades, a slug.
 * Every number — the price, the Dodo product, what's being bought — is resolved
 * here from the catalogue, so there is no amount in the request for anyone to
 * edit.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const product = body?.product;
  const productSlug = typeof body?.productSlug === "string" ? body.productSlug : null;

  if (!isProductKey(product)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const spec = PRODUCTS[product];
  const kind = kindFor(product);
  const origin = new URL(request.url).origin;
  const admin = createAdminClient();

  // ── resolve exactly what's being bought ──
  let referenceId: string;

  if (spec.placement === "sidebar" || spec.placement === "feed") {
    const claimed = await claimSlot(spec.placement, user.id);
    if (!claimed) {
      const many = (spec.slots ?? 1) > 1;
      return NextResponse.json(
        {
          error: many
            ? `All ${spec.slots} ${spec.name} slots are booked for ${monthKey()}. Try next month.`
            : `The ${spec.name} is booked for ${monthKey()}. Try next month.`,
        },
        { status: 409 }
      );
    }
    referenceId = claimed.id;
  } else if (product === "featured") {
    const week = currentWeekKey();
    const availability = await getFeaturedAvailability(week);
    if (availability.open === 0) {
      return NextResponse.json(
        { error: `All ${availability.total} Featured slots are taken for ${weekLabel(week)}.` },
        { status: 409 }
      );
    }

    const target = await ownProduct(admin, user.id, productSlug);
    if (!target) {
      return NextResponse.json(
        { error: "Launch a product first — Featured pins a listing you already have." },
        { status: 400 }
      );
    }
    if (target.featured_until && new Date(target.featured_until) > new Date()) {
      return NextResponse.json({ error: "That launch is already Featured." }, { status: 409 });
    }
    referenceId = target.id;
  } else if (product === "premium") {
    if (await isPremium(user.id)) {
      return NextResponse.json({ error: "You're already on Premium." }, { status: 409 });
    }
    // A subscription belongs to the person, not to a product.
    referenceId = user.id;
  } else {
    // directory (any tier) — a one-off, human-fulfilled service. No launch
    // required: if the buyer has a launch we attach it, otherwise we bill the
    // person and collect their product details after checkout.
    const target = await ownProduct(admin, user.id, productSlug);
    referenceId = target?.id ?? user.id;
  }

  // Best-effort ledger row. Never blocks checkout — the webhook and the success
  // page both reconcile afterwards.
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

/** The buyer's own product — named by slug, or their most recent one. */
async function ownProduct(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string | null
) {
  let query = admin
    .from("launch_products")
    .select("id, slug, featured_until")
    .eq("maker_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (slug) query = query.eq("slug", slug);
  const { data } = await query;
  return data?.[0] || null;
}
