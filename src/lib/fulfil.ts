// ─── Fulfilment ─────────────────────────────────────────────
// What actually happens once money lands. Called from two places — the Dodo
// webhook and the post-checkout success page — so it has to be idempotent:
// whichever confirms first does the work, the second is a no-op.

import { createAdminClient } from "@/lib/supabase/server";

export type FulfilArgs = {
  kind: string; // ad_sidebar | ad_feed | premium
  referenceId: string; // launch_ads.id or launch_products.id
  buyerId?: string;
  dodoPaymentId?: string;
};

export async function fulfilPurchase({
  kind,
  referenceId,
  buyerId,
  dodoPaymentId,
}: FulfilArgs): Promise<{ ok: boolean; note: string }> {
  const admin = createAdminClient();

  try {
    if (kind === "ad_sidebar" || kind === "ad_feed") {
      const { data: ad } = await admin
        .from("launch_ads")
        .select("id, active")
        .eq("id", referenceId)
        .maybeSingle();

      if (!ad) return { ok: false, note: "ad slot not found" };
      if (!ad.active) {
        await admin.from("launch_ads").update({ active: true }).eq("id", referenceId);
      }
    } else if (kind === "premium") {
      const { data: product } = await admin
        .from("launch_products")
        .select("id, verified")
        .eq("id", referenceId)
        .maybeSingle();

      if (!product) return { ok: false, note: "product not found" };
      if (!product.verified) {
        await admin
          .from("launch_products")
          .update({ verified: true, tier: "premium" })
          .eq("id", referenceId);
      }
    } else {
      return { ok: false, note: `unknown kind: ${kind}` };
    }

    // Settle the ledger row for this reference. Matching on status keeps a
    // replayed webhook from rewriting an already-paid record.
    let ledger = admin
      .from("launch_payments")
      .update({ status: "paid", dodo_payment_id: dodoPaymentId || null })
      .eq("reference_id", referenceId)
      .eq("status", "pending");
    if (buyerId) ledger = ledger.eq("user_id", buyerId);
    await ledger;

    return { ok: true, note: "fulfilled" };
  } catch (e: any) {
    console.error("fulfil:", e?.message || e);
    return { ok: false, note: e?.message || "fulfilment failed" };
  }
}
