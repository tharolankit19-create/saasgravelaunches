// ─── Paid ad placements ─────────────────────────────────────
// Two on-board placements, both sold per calendar month:
//   sidebar — 3 slots in the right rail
//   feed    — 1 Prime banner inside the board, below the #3 launch
// Everything here reads; the only writes happen in the checkout route and the
// webhook.

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { monthKey, shiftMonth } from "@/lib/week";
import { PRODUCTS, slotIndexes, type ProductKey } from "@/lib/pricing";

/** The two monthly ad placements. */
export type AdPlacement = "sidebar" | "feed";

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

const AD_FIELDS =
  "id, placement, month_key, slot_index, headline, body, cta_label, cta_url, image_url, active, click_count";

/** Live ads for a placement this month, in slot order. */
export async function getLiveAds(placement: AdPlacement = "sidebar"): Promise<Ad[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_ads")
    .select(AD_FIELDS)
    .eq("placement", placement)
    .eq("month_key", monthKey())
    .eq("active", true)
    .order("slot_index");
  // A paid slot whose creative hasn't arrived yet shouldn't render an empty box.
  return ((data || []) as Ad[]).filter((a) => a.headline && a.cta_url);
}

/** The single live Prime (in-board) banner this month, if any. */
export async function getLiveFeedAd(): Promise<Ad | null> {
  const [ad] = await getLiveAds("feed");
  return ad || null;
}

export type Availability = { monthKey: string; taken: number; total: number; open: number };

/**
 * How long an unpaid row holds a slot.
 *
 * A row is inserted the moment someone opens checkout — that's what makes the
 * unique constraint act as a lock. But most people who open a checkout never
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

/** How many slots are left for a placement, this month and the next two. */
export async function getAvailability(
  placement: AdPlacement = "sidebar",
  months = 3
): Promise<Availability[]> {
  const supabase = createClient();
  const keys = Array.from({ length: months }, (_, i) => shiftMonth(monthKey(), i));
  const total = PRODUCTS[placement as ProductKey].slots ?? 1;

  const { data } = await supabase
    .from("launch_ads")
    .select("month_key, slot_index, active, created_at")
    .eq("placement", placement)
    .in("month_key", keys);

  return keys.map((key) => {
    const taken = (data || []).filter((r: any) => r.month_key === key && occupies(r)).length;
    return { monthKey: key, taken, total, open: Math.max(0, total - taken) };
  });
}

/**
 * Claim the lowest free slot for a placement this month.
 *
 * The insert is the lock: `unique (placement, month_key, slot_index)` means two
 * buyers racing for the last slot can't both win — the loser gets a conflict
 * and we move to the next index, or report a genuine sell-out.
 */
export async function claimSlot(
  placement: AdPlacement,
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
      .eq("placement", placement)
      .eq("month_key", month)
      .eq("active", false)
      .lt("created_at", holdCutoff());
  } catch (e: any) {
    console.error("claimSlot: hold sweep failed (continuing):", e?.message || e);
  }

  for (const slotIndex of slotIndexes(placement as ProductKey)) {
    const { data, error } = await admin
      .from("launch_ads")
      .insert({
        placement,
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

/** The buyer's own slots, for the dashboard. */
export async function getMyAds(userId: string): Promise<Ad[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_ads")
    .select(AD_FIELDS)
    .eq("buyer_id", userId)
    .order("month_key", { ascending: false });
  return (data || []) as Ad[];
}

/** How many Featured slots are left in a given week. */
export async function getFeaturedAvailability(week: string): Promise<Availability> {
  const supabase = createClient();
  const total = PRODUCTS.featured.slots ?? 3;
  const { count } = await supabase
    .from("launch_products")
    .select("id", { count: "exact", head: true })
    .eq("featured_week", week)
    .gt("featured_until", new Date().toISOString());
  const taken = count || 0;
  return { monthKey: week, taken, total, open: Math.max(0, total - taken) };
}
