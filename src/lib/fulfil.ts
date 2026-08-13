// ─── Fulfilment ─────────────────────────────────────────────
// What happens once money lands. Called from two places — the Dodo webhook and
// the post-checkout success page — so it must be idempotent: whichever confirms
// first does the work, the second is a no-op.

import { createAdminClient } from "@/lib/supabase/server";
import { weekKey, weekRange } from "@/lib/week";

export type FulfilArgs = {
  /** featured | ad_sidebar | directory | premium */
  kind: string;
  /** launch_products.id, launch_ads.id, or the buyer's own id for premium. */
  referenceId: string;
  buyerId?: string;
  dodoPaymentId?: string;
  dodoSubscriptionId?: string;
};

export async function fulfilPurchase({
  kind,
  referenceId,
  buyerId,
  dodoPaymentId,
  dodoSubscriptionId,
}: FulfilArgs): Promise<{ ok: boolean; note: string }> {
  const admin = createAdminClient();

  try {
    switch (kind) {
      // ── $9 · Featured for one ISO week ──
      case "featured": {
        const { data: product } = await admin
          .from("launch_products")
          .select("id, launch_week, featured_until")
          .eq("id", referenceId)
          .maybeSingle();
        if (!product) return { ok: false, note: "product not found" };

        // Already running? Nothing to do — a replayed webhook must not extend it.
        if (product.featured_until && new Date(product.featured_until) > new Date()) {
          break;
        }

        // Featured runs to the end of the week the product launched in, so what
        // was bought ("featured for my launch week") is exactly what's given.
        const week = product.launch_week || weekKey();
        const { end } = weekRange(week);
        await admin
          .from("launch_products")
          .update({ featured_week: week, featured_until: end.toISOString() })
          .eq("id", referenceId);
        break;
      }

      // ── $19/month · sidebar slot ──
      case "ad_sidebar": {
        const { data: ad } = await admin
          .from("launch_ads")
          .select("id, active")
          .eq("id", referenceId)
          .maybeSingle();
        if (!ad) return { ok: false, note: "ad slot not found" };
        if (!ad.active) {
          await admin.from("launch_ads").update({ active: true }).eq("id", referenceId);
        }
        break;
      }

      // ── $29/month · Premium subscription ──
      case "premium": {
        const userId = buyerId || referenceId;
        if (!userId) return { ok: false, note: "no buyer for subscription" };

        const { data: existing } = await admin
          .from("launch_subscriptions")
          .select("id, status, current_period_end")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        // A month from now. Dodo's own renewal webhooks push this forward; if one
        // never arrives the subscription lapses on its own rather than running free.
        const periodEnd = new Date(Date.now() + 31 * 86_400_000).toISOString();
        const row = existing?.[0];

        if (row) {
          const alreadyCurrent =
            row.status === "active" &&
            row.current_period_end &&
            new Date(row.current_period_end) > new Date(Date.now() + 25 * 86_400_000);
          if (alreadyCurrent) break; // replayed webhook

          await admin
            .from("launch_subscriptions")
            .update({
              status: "active",
              current_period_end: periodEnd,
              dodo_subscription_id: dodoSubscriptionId || row.id,
              dodo_payment_id: dodoPaymentId || null,
            })
            .eq("id", row.id);
        } else {
          await admin.from("launch_subscriptions").insert({
            user_id: userId,
            status: "active",
            current_period_end: periodEnd,
            dodo_subscription_id: dodoSubscriptionId || null,
            dodo_payment_id: dodoPaymentId || null,
          });
        }

        // The verified badge is a Premium perk, so it follows the subscription
        // across every product this maker owns.
        await admin
          .from("launch_products")
          .update({ verified: true, tier: "premium" })
          .eq("maker_id", userId);
        break;
      }

      // ── $99 · directory blast. Fulfilled by a human; this records the order. ──
      case "directory":
        break;

      default:
        return { ok: false, note: `unknown kind: ${kind}` };
    }

    // Settle the ledger. Matching on `pending` keeps a replayed webhook from
    // rewriting a record that was already closed.
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
