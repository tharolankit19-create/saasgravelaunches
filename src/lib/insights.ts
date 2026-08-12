// ─── Traffic diagnosis ──────────────────────────────────────
// Turns the raw event log into the report the admin page renders and the
// Hermes watcher polls: how much traffic, where it came from, where it died,
// and which of those numbers is worth doing something about tonight.
//
// The findings are computed with plain rules — thresholds you can read and
// argue with — so the same answer comes back whether or not an AI key is set.
// The AI layer on top only rewrites them into prose; it never invents one.

import { createAdminClient } from "@/lib/supabase/server";
import { FUNNEL, sourceLabel } from "@/lib/analytics";
import { currentWeekKey } from "@/lib/week";

export type Finding = {
  severity: "critical" | "warn" | "info";
  title: string;
  detail: string;
  /** What the admin should actually do about it. */
  action: string;
};

export type FunnelStep = {
  event: string;
  label: string;
  sessions: number;
  /** Share of the step above that made it here. */
  stepRate: number;
  /** Share of all sessions that made it here. */
  totalRate: number;
  dropped: number;
};

export type Insights = {
  windowDays: number;
  generatedAt: string;
  totals: {
    events: number;
    sessions: number;
    pageViews: number;
    productViews: number;
    upvotes: number;
    comments: number;
    outboundClicks: number;
    publishes: number;
    signins: number;
  };
  daily: { day: string; sessions: number; pageViews: number }[];
  sources: { host: string; label: string; sessions: number; share: number }[];
  topPaths: { path: string; views: number }[];
  topProducts: { slug: string; views: number }[];
  funnel: FunnelStep[];
  friction: {
    bounceRate: number;
    autofillAttempts: number;
    autofillErrors: number;
    autofillErrorRate: number;
    publishBlocked: number;
    publishErrors: number;
    abandonedDrafts: number;
  };
  content: {
    liveThisWeek: number;
    liveTotal: number;
    draftsTotal: number;
    zeroUpvoteLive: number;
  };
  findings: Finding[];
};

type EventRow = {
  event: string;
  path: string | null;
  referrer_host: string | null;
  session_id: string | null;
  product_slug: string | null;
  created_at: string;
};

const MAX_ROWS = 20000;

export async function buildInsights(windowDays = 7): Promise<Insights> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const [{ data: events }, content] = await Promise.all([
    admin
      .from("launch_events")
      .select("event, path, referrer_host, session_id, product_slug, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    contentSnapshot(admin),
  ]);

  const rows = (events || []) as EventRow[];
  return summarise(rows, windowDays, content);
}

async function contentSnapshot(admin: ReturnType<typeof createAdminClient>) {
  const week = currentWeekKey();
  const count = async (build: (q: any) => any) => {
    const { count } = await build(
      admin.from("launch_products").select("id", { count: "exact", head: true })
    );
    return count || 0;
  };

  const [liveThisWeek, liveTotal, draftsTotal, zeroUpvoteLive] = await Promise.all([
    count((q: any) => q.eq("status", "live").eq("launch_week", week)),
    count((q: any) => q.eq("status", "live")),
    count((q: any) => q.eq("status", "draft")),
    count((q: any) => q.eq("status", "live").eq("upvote_count", 0)),
  ]);

  return { liveThisWeek, liveTotal, draftsTotal, zeroUpvoteLive };
}

// ─── the maths ──────────────────────────────────────────────

export function summarise(
  rows: EventRow[],
  windowDays: number,
  content: Insights["content"]
): Insights {
  const sessionsWith = (event: string) =>
    new Set(rows.filter((r) => r.event === event && r.session_id).map((r) => r.session_id!));

  const countOf = (event: string) => rows.filter((r) => r.event === event).length;

  const allSessions = new Set(rows.map((r) => r.session_id).filter(Boolean) as string[]);
  const totalSessions = allSessions.size;

  // ── funnel, measured in sessions rather than hits ──
  const funnel: FunnelStep[] = [];
  let previous = 0;
  FUNNEL.forEach((step, i) => {
    const sessions = sessionsWith(step.event).size;
    const stepRate = i === 0 ? 1 : previous > 0 ? sessions / previous : 0;
    funnel.push({
      event: step.event,
      label: step.label,
      sessions,
      stepRate,
      totalRate: totalSessions > 0 ? sessions / totalSessions : 0,
      dropped: i === 0 ? 0 : Math.max(0, previous - sessions),
    });
    previous = sessions;
  });

  // ── sources ──
  // A session has exactly one source: the referrer on its first event. Counting
  // every event's host instead would file one visitor under three channels and
  // push the shares past 100%.
  const firstSource = new Map<string, { host: string; at: number }>();
  for (const r of rows) {
    if (!r.session_id) continue;
    const host = r.referrer_host || "direct";
    if (host === "internal") continue; // on-site navigation isn't acquisition
    const at = Date.parse(r.created_at) || 0;
    const seen = firstSource.get(r.session_id);
    // Earliest wins; a real referrer beats "direct" when they arrive together,
    // because the direct row is usually a later same-session event.
    if (!seen || at < seen.at || (at === seen.at && seen.host === "direct" && host !== "direct")) {
      firstSource.set(r.session_id, { host, at });
    }
  }

  const bySource = new Map<string, number>();
  for (const { host } of firstSource.values()) {
    bySource.set(host, (bySource.get(host) || 0) + 1);
  }

  const sources = [...bySource.entries()]
    .map(([host, sessions]) => ({
      host,
      label: sourceLabel(host),
      sessions,
      share: totalSessions > 0 ? sessions / totalSessions : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 12);

  // ── daily shape ──
  const dayMap = new Map<string, { sessions: Set<string>; views: number }>();
  for (let i = windowDays - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    dayMap.set(day, { sessions: new Set(), views: 0 });
  }
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const slot = dayMap.get(day);
    if (!slot) continue;
    if (r.session_id) slot.sessions.add(r.session_id);
    if (r.event === "page_view") slot.views++;
  }
  const daily = [...dayMap.entries()].map(([day, v]) => ({
    day,
    sessions: v.sessions.size,
    pageViews: v.views,
  }));

  // ── top pages & products ──
  const tally = (key: (r: EventRow) => string | null, filter: (r: EventRow) => boolean) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (!filter(r)) continue;
      const k = key(r);
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const topPaths = tally((r) => r.path, (r) => r.event === "page_view").map(([path, views]) => ({
    path,
    views,
  }));
  const topProducts = tally(
    (r) => r.product_slug,
    (r) => r.event === "product_view"
  ).map(([slug, views]) => ({ slug, views }));

  // ── friction ──
  const perSession = new Map<string, number>();
  for (const r of rows) {
    if (!r.session_id) continue;
    perSession.set(r.session_id, (perSession.get(r.session_id) || 0) + 1);
  }
  const oneHitSessions = [...perSession.values()].filter((n) => n <= 1).length;
  const autofillAttempts = countOf("autofill_attempt");
  const autofillErrors = countOf("autofill_error");
  const submitStarts = sessionsWith("submit_start").size;
  const publishes = sessionsWith("publish_success").size;

  const friction = {
    bounceRate: totalSessions > 0 ? oneHitSessions / totalSessions : 0,
    autofillAttempts,
    autofillErrors,
    autofillErrorRate: autofillAttempts > 0 ? autofillErrors / autofillAttempts : 0,
    publishBlocked: countOf("publish_blocked"),
    publishErrors: countOf("publish_error"),
    abandonedDrafts: Math.max(0, submitStarts - publishes),
  };

  const totals = {
    events: rows.length,
    sessions: totalSessions,
    pageViews: countOf("page_view"),
    productViews: countOf("product_view"),
    upvotes: countOf("upvote"),
    comments: countOf("comment"),
    outboundClicks: countOf("outbound_click"),
    publishes: countOf("publish_success"),
    signins: countOf("signin_success"),
  };

  const insights: Insights = {
    windowDays,
    generatedAt: new Date().toISOString(),
    totals,
    daily,
    sources,
    topPaths,
    topProducts,
    funnel,
    friction,
    content,
    findings: [],
  };

  insights.findings = diagnose(insights);
  return insights;
}

/**
 * The rules. Each one is a threshold plus the action it implies — a finding
 * without an action is just a number, and the admin already has those.
 */
export function diagnose(i: Insights): Finding[] {
  const out: Finding[] = [];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  if (i.totals.sessions < 20) {
    out.push({
      severity: "info",
      title: "Not enough traffic to draw conclusions",
      detail: `${i.totals.sessions} sessions in ${i.windowDays} days. Rates below are noisy at this volume.`,
      action: "Treat this as a smoke test — get the first hundred sessions before optimising anything.",
    });
  }

  const opened = i.funnel.find((f) => f.event === "submit_start");
  const published = i.funnel.find((f) => f.event === "publish_success");

  if (opened && opened.sessions >= 5 && published) {
    const completion = opened.sessions > 0 ? published.sessions / opened.sessions : 0;
    if (completion < 0.35) {
      out.push({
        severity: "critical",
        title: "Makers open the form and don't finish",
        detail: `${opened.sessions} sessions opened the launch form, ${published.sessions} published — ${pct(completion)} completion. ${i.friction.abandonedDrafts} started and stopped.`,
        action:
          "Cut a field, or check that autofill is actually filling. This is the single number that decides whether the board fills up.",
      });
    }
  }

  if (i.friction.autofillAttempts >= 5 && i.friction.autofillErrorRate > 0.25) {
    out.push({
      severity: "critical",
      title: "Autofill is failing often",
      detail: `${i.friction.autofillErrors} of ${i.friction.autofillAttempts} autofill attempts errored (${pct(i.friction.autofillErrorRate)}).`,
      action:
        "Check the OpenRouter key and the model ladder. Autofill failing turns a 20-second launch back into a form.",
    });
  }

  if (i.friction.publishBlocked >= 3) {
    out.push({
      severity: "warn",
      title: "Publishes are being blocked by the support rule",
      detail: `${i.friction.publishBlocked} publish attempts were blocked because the maker hadn't upvoted three other launches yet.`,
      action:
        "That rule is working as designed, but make sure the form says so before they fill it in, not after they press publish.",
    });
  }

  if (i.friction.publishErrors >= 1) {
    out.push({
      severity: "critical",
      title: "Publishes are erroring server-side",
      detail: `${i.friction.publishErrors} publish attempts failed with an error, not a validation block.`,
      action: "Check the server logs for /api/launch — these are lost launches, not lost interest.",
    });
  }

  if (i.totals.sessions >= 40 && i.friction.bounceRate > 0.7) {
    out.push({
      severity: "warn",
      title: "Most visitors see one page and leave",
      detail: `${pct(i.friction.bounceRate)} of sessions fired a single event.`,
      action:
        "The landing page isn't earning a second click. Lead with this week's board instead of the pitch.",
    });
  }

  const direct = i.sources.find((s) => s.host === "direct");
  if (i.totals.sessions >= 40 && direct && direct.share > 0.8) {
    out.push({
      severity: "info",
      title: "Almost all traffic is unattributed",
      detail: `${pct(direct.share)} of sessions arrive with no referrer.`,
      action: "Add UTM tags to the links you share so you can tell which channel is actually working.",
    });
  }

  const top = i.sources.find((s) => s.host !== "direct");
  if (top && top.sessions >= 10) {
    out.push({
      severity: "info",
      title: `${top.label} is your best channel`,
      detail: `${top.sessions} sessions (${pct(top.share)} of all traffic) came from ${top.label}.`,
      action: "Do more of exactly that, and stop spreading effort across channels sending single digits.",
    });
  }

  if (i.content.liveThisWeek === 0) {
    out.push({
      severity: "critical",
      title: "This week's board is empty",
      detail: "No launch has gone live in the current ISO week.",
      action:
        "An empty board makes every visitor bounce. Seed it — reach out to last week's makers, or move a draft in.",
    });
  } else if (i.content.liveThisWeek < 3) {
    out.push({
      severity: "warn",
      title: "This week's board is thin",
      detail: `Only ${i.content.liveThisWeek} launch(es) live this week.`,
      action: "Fewer than three and the leaderboard reads as abandoned. Push for submissions before the week closes.",
    });
  }

  if (i.content.zeroUpvoteLive >= 3) {
    out.push({
      severity: "warn",
      title: "Live launches with zero upvotes",
      detail: `${i.content.zeroUpvoteLive} live products have never been upvoted.`,
      action:
        "Makers who get nothing don't come back. Feature them in the newsletter or nudge the support rule higher.",
    });
  }

  if (i.totals.productViews >= 30 && i.totals.outboundClicks / Math.max(1, i.totals.productViews) < 0.05) {
    out.push({
      severity: "warn",
      title: "Product pages aren't sending traffic onward",
      detail: `${i.totals.outboundClicks} outbound clicks from ${i.totals.productViews} product views.`,
      action:
        "Makers judge us on the traffic we send them. Make the Visit button louder on the product page.",
    });
  }

  const order = { critical: 0, warn: 1, info: 2 } as const;
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
