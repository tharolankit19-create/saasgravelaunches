// ─── Reading the board ──────────────────────────────────────
// Every query the feed, product page, leaderboard and profiles need, in one
// place, so ranking is defined exactly once.

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { currentWeekKey, shiftWeek, type WeekKey } from "@/lib/week";
import { SUPPORT_GATE_MIN_PRODUCTS, WEEK_SLOT_CAP } from "@/lib/pricing";

export type Maker = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  x_handle?: string | null;
  website_url?: string | null;
  maker_headline?: string | null;
};

export type LaunchProduct = {
  id: string;
  slug: string;
  maker_id: string;
  name: string;
  tagline: string;
  description: string | null;
  website_url: string;
  logo_url: string | null;
  gallery_urls: string[] | null;
  categories: string[] | null;
  pricing_model: string | null;
  who_for: string | null;
  problem: string | null;
  solution: string | null;
  unique_edge: string | null;
  seo_title: string | null;
  seo_description: string | null;
  keywords: string[] | null;
  alternatives: string[] | null;
  faq: { q: string; a: string }[] | null;
  maker_note: string | null;
  status: string;
  launch_week: string | null;
  launched_at: string | null;
  tier: string;
  verified: boolean;
  /** Editor's pick. A badge only — it never moves a product up the board. */
  featured: boolean;
  featured_at: string | null;
  /** Paid $9 Featured placement — shown in a labelled strip, not in the ranking. */
  featured_until: string | null;
  featured_week: string | null;
  upvote_count: number;
  comment_count: number;
  view_count: number;
  click_count: number;
  /** Arrivals from the maker's own embedded badge. */
  badge_clicks: number;
  created_at: string;
  profiles?: Maker | null;
};

export const PRODUCT_FIELDS =
  "id, slug, maker_id, name, tagline, description, website_url, logo_url, gallery_urls, categories, pricing_model, who_for, problem, solution, unique_edge, seo_title, seo_description, keywords, alternatives, faq, maker_note, status, launch_week, launched_at, tier, verified, featured, featured_at, featured_until, featured_week, upvote_count, comment_count, view_count, click_count, badge_clicks, created_at";

const WITH_MAKER = `${PRODUCT_FIELDS}, profiles:maker_id (id, full_name, avatar_url, bio, x_handle, website_url, maker_headline)`;

/**
 * The ranked board for one ISO week.
 *
 * Ranking is upvotes, then whoever launched earlier. That's the whole formula —
 * no tier, no payment and no editorial flag touches it.
 *
 * Paid Featured placements are NOT mixed in here. They're returned separately by
 * `getFeaturedForWeek` and rendered in a labelled strip above the board, and
 * they still appear at their true position in this list. A ranking you can buy
 * into is just an ad wearing a rank, and the pricing page promises otherwise.
 */
export async function getWeekBoard(week: WeekKey): Promise<LaunchProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("launch_products")
    .select(WITH_MAKER)
    .eq("status", "live")
    .eq("launch_week", week)
    .order("upvote_count", { ascending: false })
    .order("launched_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("getWeekBoard:", error.message);
    return [];
  }
  return (data || []) as unknown as LaunchProduct[];
}

/** Paid Featured placements running in a week — the labelled strip. */
export async function getFeaturedForWeek(week: WeekKey): Promise<LaunchProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_products")
    .select(WITH_MAKER)
    .eq("status", "live")
    .eq("featured_week", week)
    .gt("featured_until", new Date().toISOString())
    .order("upvote_count", { ascending: false })
    .limit(5);
  return (data || []) as unknown as LaunchProduct[];
}

/** Last week's top three — the "recent winners" rail. */
export async function getLastWeekWinners(limit = 3): Promise<LaunchProduct[]> {
  const board = await getWeekBoard(shiftWeek(currentWeekKey(), -1));
  return board.slice(0, limit);
}

/** All-time top launches, for the leaderboard page. */
export async function getAllTimeTop(limit = 50): Promise<LaunchProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_products")
    .select(WITH_MAKER)
    .eq("status", "live")
    .order("upvote_count", { ascending: false })
    .order("launched_at", { ascending: true })
    .limit(limit);
  return (data || []) as unknown as LaunchProduct[];
}

export type WeekSlots = { week: WeekKey; used: number; cap: number; open: number };

/**
 * How many free slots are left in each of the given weeks. The cap counts only
 * NON-Premium live launches — Premium launches into any week regardless — so
 * this is what a free maker sees when choosing when to launch. Read through the
 * service role so the count is the true total, not one visitor's RLS view.
 */
export async function getWeekSlots(weeks: WeekKey[]): Promise<WeekSlots[]> {
  if (!weeks.length) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("launch_products")
      .select("launch_week, tier")
      .eq("status", "live")
      .in("launch_week", weeks);

    const counts = new Map<string, number>();
    for (const r of (data || []) as { launch_week: string | null; tier: string | null }[]) {
      if (!r.launch_week || r.tier === "premium") continue; // premium doesn't consume a slot
      counts.set(r.launch_week, (counts.get(r.launch_week) || 0) + 1);
    }

    return weeks.map((week) => {
      const used = counts.get(week) || 0;
      return { week, used, cap: WEEK_SLOT_CAP, open: Math.max(0, WEEK_SLOT_CAP - used) };
    });
  } catch (e: any) {
    console.error("getWeekSlots:", e?.message || e);
    // Fail OPEN — never block launching because a count hiccuped.
    return weeks.map((week) => ({ week, used: 0, cap: WEEK_SLOT_CAP, open: WEEK_SLOT_CAP }));
  }
}

export type LeaderRange = "week" | "month" | "all";

export function isLeaderRange(v: unknown): v is LeaderRange {
  return v === "week" || v === "month" || v === "all";
}

/**
 * The leaderboard, over a chosen window. Ranking is always upvotes then who
 * launched first — the same formula the board uses; only the window changes.
 *   week  — this ISO week's board
 *   month — everything launched in the last ~31 days
 *   all   — every live launch, all time
 */
export async function getLeaderboard(range: LeaderRange, limit = 50): Promise<LaunchProduct[]> {
  if (range === "week") {
    const board = await getWeekBoard(currentWeekKey());
    return board.slice(0, limit);
  }

  const supabase = createClient();
  let query = supabase
    .from("launch_products")
    .select(WITH_MAKER)
    .eq("status", "live")
    .order("upvote_count", { ascending: false })
    .order("launched_at", { ascending: true })
    .limit(limit);

  if (range === "month") {
    const since = new Date(Date.now() - 31 * 86_400_000).toISOString();
    query = query.gte("launched_at", since);
  }

  const { data } = await query;
  return (data || []) as unknown as LaunchProduct[];
}

/** The directory — every live launch, newest first, optionally filtered. */
export async function getDirectory(opts: {
  category?: string;
  q?: string;
  limit?: number;
} = {}): Promise<LaunchProduct[]> {
  const supabase = createClient();
  let query = supabase
    .from("launch_products")
    .select(WITH_MAKER)
    .eq("status", "live")
    .order("upvote_count", { ascending: false })
    .limit(opts.limit ?? 120);

  if (opts.category) query = query.contains("categories", [opts.category]);
  if (opts.q) {
    // Strip the characters that would break PostgREST's or()/ilike grammar
    // (commas, parens, wildcards) — otherwise a stray one makes search look
    // like it does nothing.
    const safe = opts.q.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);
    if (safe) query = query.or(`name.ilike.%${safe}%,tagline.ilike.%${safe}%`);
  }

  const { data } = await query;
  return (data || []) as unknown as LaunchProduct[];
}

export async function getProductBySlug(slug: string): Promise<LaunchProduct | null> {
  const supabase = createClient();
  const { data } = await supabase.from("launch_products").select(WITH_MAKER).eq("slug", slug).maybeSingle();
  return (data as unknown as LaunchProduct) || null;
}

/** Where a live product placed in its own week. */
export async function getWeekRank(product: LaunchProduct): Promise<number | null> {
  if (!product.launch_week || product.status !== "live") return null;
  const board = await getWeekBoard(product.launch_week);
  const idx = board.findIndex((p) => p.id === product.id);
  return idx === -1 ? null : idx + 1;
}

export async function getMakerProducts(makerId: string): Promise<LaunchProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_products")
    .select(PRODUCT_FIELDS)
    .eq("maker_id", makerId)
    .order("created_at", { ascending: false });
  return (data || []) as unknown as LaunchProduct[];
}

export async function getMaker(id: string): Promise<Maker | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, x_handle, website_url, maker_headline")
    .eq("id", id)
    .maybeSingle();
  return (data as Maker) || null;
}

export type Comment = {
  id: string;
  product_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  profiles?: Maker | null;
};

export async function getComments(productId: string): Promise<Comment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("launch_comments")
    .select("id, product_id, author_id, parent_id, body, created_at, profiles:author_id (id, full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })
    .limit(300);
  return (data || []) as unknown as Comment[];
}

/** Which of these products has the signed-in user already upvoted? */
export async function getMyUpvotes(productIds: string[]): Promise<Set<string>> {
  if (!productIds.length) return new Set();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("launch_upvotes")
    .select("product_id")
    .eq("user_id", user.id)
    .in("product_id", productIds);
  return new Set((data || []).map((r: any) => r.product_id as string));
}

/**
 * Is the support-three-makers gate switched on yet?
 *
 * Two conditions, both required:
 *   1. A master switch, OFF by default. In the early phase the board is too
 *      small to ask a founder to upvote three others before their own launch —
 *      so the whole mechanism stays off until you set SUPPORT_GATE_ENABLED=true.
 *   2. Even when enabled, it only turns on once there's real depth
 *      (SUPPORT_GATE_MIN_PRODUCTS live products), so it can't strand the first
 *      makers on a near-empty board.
 *
 * Read through the service role so the count is the true platform total, not
 * what one visitor's RLS lets them see.
 */
export async function isSupportGateActive(): Promise<boolean> {
  // Off unless explicitly turned on. This is the switch that removes the
  // "upvote 3 first" rule entirely for now.
  if (process.env.SUPPORT_GATE_ENABLED !== "true") return false;

  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("launch_products")
      .select("id", { count: "exact", head: true })
      .eq("status", "live");
    return (count || 0) >= SUPPORT_GATE_MIN_PRODUCTS;
  } catch (e: any) {
    // Fail OPEN — a counting hiccup must not block every launch on the platform.
    console.error("isSupportGateActive:", e?.message || e);
    return false;
  }
}

/**
 * How many other makers' launches this user has supported. Drives the
 * "support three, then launch" gate — read through the service role so the
 * count can't be faked by a client that can't see other people's rows.
 */
export async function getSupportCount(userId: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("launch_support_count", { p_user: userId });
    if (error) throw error;
    return Number(data) || 0;
  } catch (e: any) {
    console.error("getSupportCount:", e?.message || e);
    return 0;
  }
}

/**
 * Just this week's live count — one HEAD count, nothing else. The masthead
 * renders on every page, so it must not pull the full `getSiteStats` payload
 * (which scans up to 5000 maker rows) on every single navigation.
 */
export async function getLiveWeekCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("launch_products")
    .select("id", { count: "exact", head: true })
    .eq("status", "live")
    .eq("launch_week", currentWeekKey());
  return count || 0;
}

/** Headline numbers for the landing page. Cheap counts, no row payloads. */
export async function getSiteStats() {
  const supabase = createClient();
  const week = currentWeekKey();

  const countLive = async (extra?: (q: any) => any) => {
    let q = supabase.from("launch_products").select("id", { count: "exact", head: true }).eq("status", "live");
    if (extra) q = extra(q);
    const { count } = await q;
    return count || 0;
  };

  const [liveTotal, thisWeek, makerRows, upvotesRes] = await Promise.all([
    countLive(),
    countLive((q: any) => q.eq("launch_week", week)),
    // Makers who have actually launched — NOT every row in `profiles`. That
    // table is shared with Saasgrave, so counting it would quietly pad this
    // number with people who have never been near the launchpad.
    supabase.from("launch_products").select("maker_id").eq("status", "live").limit(5000),
    supabase.from("launch_upvotes").select("product_id", { count: "exact", head: true }),
  ]);

  const makers = new Set((makerRows.data || []).map((r: any) => r.maker_id as string)).size;

  return {
    liveTotal,
    thisWeek,
    makers,
    upvotes: upvotesRes.count || 0,
  };
}
