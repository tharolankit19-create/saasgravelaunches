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

      // ── $29 one-off · Premium Launch ──
      // The paid alternative to the badge. The launch was held as a draft at
      // submit time and publishes here, so a listing can never be live before
      // its payment cleared — and never depends on the maker's own site.
      case "premium_launch": {
        const { data: product } = await admin
          .from("launch_products")
          .select("id, status, launch_week")
          .eq("id", referenceId)
          .maybeSingle();
        if (!product) return { ok: false, note: "product not found" };

        // Replayed webhook on an already-published launch: nothing to do.
        if (product.status === "live") break;

        const { error } = await admin
          .from("launch_products")
          .update({
            status: "live",
            launched_at: new Date().toISOString(),
            // Paid launches carry the Verified mark and don't consume one of the
            // week's free slots — that's what "launch into any week" means.
            tier: "premium",
            verified: true,
            badge_verified: true,
            badge_verified_at: new Date().toISOString(),
          })
          .eq("id", referenceId);
        if (error) {
          console.error("fulfil premium_launch:", error.message);
          return { ok: false, note: "couldn't publish paid launch" };
        }
        break;
      }

      // ── $19/month · sidebar slot ──
      // Both on-board ad placements activate the same way.
      case "ad_sidebar":
      case "ad_feed": {
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

      // ── directory blast. The submissions are fulfilled by a human; what
      //    happens here is the part that's ours to do. Every directory tier
      //    includes a launch on this board, so if the buyer bought it from the
      //    configure step their listing is sitting as a draft — publish it, the
      //    same way a Premium Launch publishes. When the purchase wasn't tied to
      //    a draft (referenceId is the buyer, not a product) this is a no-op.
      case "directory": {
        const { data: product } = await admin
          .from("launch_products")
          .select("id, status")
          .eq("id", referenceId)
          .maybeSingle();
        if (product && product.status !== "live") {
          const { error } = await admin
            .from("launch_products")
            .update({
              status: "live",
              launched_at: new Date().toISOString(),
              tier: "premium",
              verified: true,
              badge_verified: true,
              badge_verified_at: new Date().toISOString(),
            })
            .eq("id", referenceId);
          if (error) console.error("fulfil directory publish:", error.message);
        }
        break;
      }

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
