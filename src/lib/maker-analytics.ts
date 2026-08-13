// ─── Maker analytics ────────────────────────────────────────
// The thing none of the four competitors give a maker: what their launch
// actually did. Derived from `launch_events` rather than a second set of
// counters, so there's one source of truth and nothing to drift.

import { createAdminClient } from "@/lib/supabase/server";
import { sourceLabel } from "@/lib/analytics";

export type DayPoint = { day: string; views: number; clicks: number; upvotes: number };

export type ProductAnalytics = {
  slug: string;
  windowDays: number;
  totals: { views: number; clicks: number; upvotes: number; shares: number; badge: number };
  /** Clicks out ÷ page views — how well the page sells the product. */
  clickThrough: number;
  daily: DayPoint[];
  sources: { host: string; label: string; views: number; share: number }[];
  /** Upvotes per day across the week — the velocity curve. */
  velocity: { day: string; upvotes: number; cumulative: number }[];
};

const MAX_ROWS = 20000;

export async function getProductAnalytics(
  slug: string,
  windowDays = 14
): Promise<ProductAnalytics> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const { data } = await admin
    .from("launch_events")
    .select("event, referrer_host, created_at")
    .eq("product_slug", slug)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(MAX_ROWS);

  const rows = (data || []) as { event: string; referrer_host: string | null; created_at: string }[];

  // Pre-seed every day so a gap renders as zero rather than closing the gap and
  // making a quiet Tuesday look like it never happened.
  const days = new Map<string, DayPoint>();
  for (let i = windowDays - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    days.set(day, { day, views: 0, clicks: 0, upvotes: 0 });
  }

  const sources = new Map<string, number>();
  const totals = { views: 0, clicks: 0, upvotes: 0, shares: 0, badge: 0 };

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const bucket = days.get(day);

    switch (r.event) {
      case "product_view": {
        totals.views++;
        if (bucket) bucket.views++;
        const host = r.referrer_host || "direct";
        if (host !== "internal") sources.set(host, (sources.get(host) || 0) + 1);
        break;
      }
      case "outbound_click":
        totals.clicks++;
        if (bucket) bucket.clicks++;
        break;
      case "upvote":
        totals.upvotes++;
        if (bucket) bucket.upvotes++;
        break;
      case "share":
        totals.shares++;
        break;
      case "badge_copy":
        totals.badge++;
        break;
    }
  }

  const daily = [...days.values()];
  let running = 0;
  const velocity = daily.map((d) => {
    running += d.upvotes;
    return { day: d.day, upvotes: d.upvotes, cumulative: running };
  });

  const totalSourceViews = [...sources.values()].reduce((a, b) => a + b, 0);

  return {
    slug,
    windowDays,
    totals,
    clickThrough: totals.views > 0 ? totals.clicks / totals.views : 0,
    daily,
    sources: [...sources.entries()]
      .map(([host, views]) => ({
        host,
        label: sourceLabel(host),
        views,
        share: totalSourceViews > 0 ? views / totalSourceViews : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    velocity,
  };
}
