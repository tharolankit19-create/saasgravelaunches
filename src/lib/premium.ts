// ─── Premium & reputation ───────────────────────────────────
// One place that answers "is this person on Premium" and "what has this maker
// actually done here". Both read through the service role so a client can't
// talk itself into a tier it hasn't paid for.

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Is this user on the $29/month tier right now?
 *
 * Answered by a `security definer` function in the database, so the gate is the
 * same whether it's called from a page, an API route or a SQL console.
 */
export async function isPremium(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await createAdminClient().rpc("launch_is_premium", { p_user: userId });
    if (error) throw error;
    return Boolean(data);
  } catch (e: any) {
    // Fail closed: an outage must not hand out a paid tier for free.
    console.error("isPremium:", e?.message || e);
    return false;
  }
}

export type MakerStats = {
  launches: number;
  upvotes_received: number;
  upvotes_given: number;
  comments_made: number;
  streak_weeks: number;
  reputation: number;
};

const EMPTY_STATS: MakerStats = {
  launches: 0,
  upvotes_received: 0,
  upvotes_given: 0,
  comments_made: 0,
  streak_weeks: 0,
  reputation: 0,
};

/**
 * A maker's standing — computed, never stored.
 *
 * Storing a score would mean writing to `profiles` on every upvote, and that
 * row belongs to Saasgrave too. Computing on read keeps the launchpad's
 * gamification out of the shared table entirely.
 */
export async function getMakerStats(userId?: string | null): Promise<MakerStats> {
  if (!userId) return EMPTY_STATS;
  try {
    const { data, error } = await createAdminClient().rpc("launch_maker_stats", { p_user: userId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row ? { ...EMPTY_STATS, ...row } : EMPTY_STATS;
  } catch (e: any) {
    console.error("getMakerStats:", e?.message || e);
    return EMPTY_STATS;
  }
}

// ─── Levels ─────────────────────────────────────────────────
// Deliberately few, and named rather than numbered. A level is a summary of
// reputation, not a second currency to grind.

export type Level = { name: string; min: number; blurb: string };

export const LEVELS: Level[] = [
  { name: "Newcomer", min: 0, blurb: "Just arrived." },
  { name: "Shipper", min: 40, blurb: "Has put something real on the board." },
  { name: "Regular", min: 140, blurb: "Launches and shows up for other makers." },
  { name: "Veteran", min: 360, blurb: "A fixture — several launches, real support given." },
  { name: "Register Keeper", min: 800, blurb: "One of the people this board is built around." },
];

export function levelFor(reputation: number): { level: Level; next: Level | null; progress: number } {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (reputation >= LEVELS[i].min) index = i;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next
    ? Math.min(1, Math.max(0, (reputation - level.min) / (next.min - level.min)))
    : 1;
  return { level, next, progress };
}

/** A short, honest description of a streak. */
export function streakLabel(weeks: number): string {
  if (weeks <= 0) return "No active streak";
  if (weeks === 1) return "1 week — streak started";
  return `${weeks} weeks in a row`;
}
