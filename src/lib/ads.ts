// ─── The paid rail ──────────────────────────────────────────
// Ads are sold per calendar month, per placement, per slot index. Everything
// here reads; the only writes happen in the checkout route and the webhook.

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { monthKey, shiftMonth } from "@/lib/week";
import { PRODUCTS, slotIndexes, type ProductKey } from "@/lib/pricing";

export type Ad = {
  id: string;
  placement: string;
  month_key: string;
  slot_index: number;
  headline: string | null;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  active: boolean;
  click_count: number;
};

/** Live ads for a placement this month, in slot order. */
export async function getLiveAds(placement: "sidebar" | "feed"): Promise<Ad[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_ads")
    .select("id, placement, month_key, slot_index, headline, body, cta_label, cta_url, image_url, active, click_count")
    .eq("placement", placement)
    .eq("month_key", monthKey())
    .eq("active", true)
    .order("slot_index");
  return ((data || []) as Ad[]).filter((a) => a.headline && a.cta_url);
}

export type Availability = { monthKey: string; taken: number; total: number; open: number };

/**
 * How long an unpaid row holds a slot.
 *
 * A row is inserted the moment someone opens checkout, which is what makes the
 * unique constraint work as a lock. But most people who open a checkout never
 * finish one, and without an expiry those abandoned rows would mark the
 * placement sold out forever.
 */
const HOLD_MINUTES = 30;

function holdCutoff(): string {
  return new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString();
}

/** Is this row occupying a slot right now — paid, or a live checkout hold? */
function occupies(row: { active: boolean; created_at?: string | null }): boolean {
  if (row.active) return true;
  return Boolean(row.created_at && row.created_at > holdCutoff());
}

/** How many slots are left, this month and the next two. */
export async function getAvailability(
  product: Exclude<ProductKey, "premium">,
  months = 3
): Promise<Availability[]> {
  const supabase = createClient();
  const keys = Array.from({ length: months }, (_, i) => shiftMonth(monthKey(), i));
  const total = PRODUCTS[product].slots ?? 1;

  const { data } = await supabase
    .from("launch_ads")
    .select("month_key, slot_index, active, created_at")
    .eq("placement", product)
    .in("month_key", keys);

  return keys.map((key) => {
    const taken = (data || []).filter((r: any) => r.month_key === key && occupies(r)).length;
    return { monthKey: key, taken, total, open: Math.max(0, total - taken) };
  });
}

/**
 * Claim the lowest free slot for a placement in a month.
 *
 * The insert is the lock: `unique (placement, month_key, slot_index)` means two
 * buyers racing for the last slot can't both win — the loser gets a conflict
 * and we move on to the next index, or report a genuine sell-out.
 */
export async function claimSlot(
  product: Exclude<ProductKey, "premium">,
  buyerId: string,
  month = monthKey()
): Promise<{ id: string; slotIndex: number } | null> {
  const admin = createAdminClient();

  // Release holds from checkouts nobody finished, so an abandoned tab doesn't
  // take a slot off the market permanently. Paid rows (`active`) are untouched.
  try {
    await admin
      .from("launch_ads")
      .delete()
      .eq("placement", product)
      .eq("month_key", month)
      .eq("active", false)
      .lt("created_at", holdCutoff());
  } catch (e: any) {
    console.error("claimSlot: hold sweep failed (continuing):", e?.message || e);
  }

  for (const slotIndex of slotIndexes(product)) {
    const { data, error } = await admin
      .from("launch_ads")
      .insert({
        placement: product,
        month_key: month,
        slot_index: slotIndex,
        buyer_id: buyerId,
        active: false, // the webhook flips this once Dodo confirms
      })
      .select("id")
      .single();

    if (!error && data) return { id: data.id, slotIndex };
    // 23505 = unique violation: that slot is already spoken for.
    if (error && (error as any).code !== "23505") {
      console.error("claimSlot:", error.message);
      return null;
    }
  }
  return null; // sold out
}

/** The buyer's own ads, for the dashboard. */
export async function getMyAds(userId: string): Promise<Ad[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_ads")
    .select("id, placement, month_key, slot_index, headline, body, cta_label, cta_url, image_url, active, click_count")
    .eq("buyer_id", userId)
    .order("month_key", { ascending: false });
  return (data || []) as Ad[];
}
