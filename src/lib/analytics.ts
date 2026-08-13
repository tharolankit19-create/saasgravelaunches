// ─── Telemetry ──────────────────────────────────────────────
// A deliberately small event log. It exists to answer three questions the
// admin (and the Hermes watcher) actually act on:
//
//   where did people come from, where did they stop, and what broke?
//
// No cookies, no fingerprinting, no third party. The session id is a random
// string the browser keeps for the tab, and it's the only identifier stored
// for a signed-out visitor.

import { createAdminClient } from "@/lib/supabase/server";

/** The events that make up the launch funnel, in order. */
export const FUNNEL: { event: string; label: string }[] = [
  { event: "page_view", label: "Landed on the site" },
  { event: "submit_start", label: "Opened the launch form" },
  { event: "autofill_success", label: "Autofilled from a URL" },
  { event: "publish_attempt", label: "Pressed publish" },
  { event: "publish_success", label: "Launch went live" },
];

export const TRACKED_EVENTS = new Set([
  ...FUNNEL.map((f) => f.event),
  "product_view",
  "autofill_attempt",
  "autofill_error",
  "publish_blocked",
  "publish_error",
  "upvote",
  "comment",
  "outbound_click",
  "ad_click",
  "signin_start",
  "signin_success",
  "pricing_view",
  "checkout_start",
  "hero_launch",
  "copilot_run",
  // The growth loop: a maker sharing the launch, and a maker taking the
  // embeddable badge. Both are worth knowing per product.
  "share",
  "badge_copy",
]);

export type TrackInput = {
  event: string;
  path?: string | null;
  referrer?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  productSlug?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Record an event. Never throws and never blocks a response — analytics
 * failing must not cost a maker their launch.
 */
export async function track(input: TrackInput): Promise<void> {
  if (!input?.event) return;
  try {
    const admin = createAdminClient();
    await admin.from("launch_events").insert({
      event: input.event.slice(0, 60),
      path: input.path?.slice(0, 300) || null,
      referrer: input.referrer?.slice(0, 400) || null,
      referrer_host: referrerHost(input.referrer),
      session_id: input.sessionId?.slice(0, 64) || null,
      user_id: input.userId || null,
      product_slug: input.productSlug?.slice(0, 80) || null,
      meta: input.meta || {},
    });
  } catch (e: any) {
    console.error("track failed (ignored):", e?.message || e);
  }
}

/**
 * The referrer, reduced to something worth grouping by. Internal traffic and
 * search engines both collapse to one label each so the top-sources list
 * shows real acquisition rather than a hundred Google URL variants.
 */
export function referrerHost(referrer?: string | null): string | null {
  const r = (referrer || "").trim();
  if (!r) return "direct";
  try {
    const host = new URL(r).hostname.replace(/^www\./, "").toLowerCase();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    const own = site ? new URL(site).hostname.replace(/^www\./, "") : "";
    if (own && host === own) return "internal";
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
    if (/(^|\.)(bing|duckduckgo|yahoo|ecosia|brave)\./.test(host)) return "search";
    if (/(^|\.)(x\.com|twitter\.com|t\.co)$/.test(host)) return "x";
    if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(host)) return "linkedin";
    if (/(^|\.)(reddit\.com|redd\.it)$/.test(host)) return "reddit";
    if (/(^|\.)(news\.ycombinator\.com)$/.test(host)) return "hackernews";
    if (/(^|\.)(producthunt\.com)$/.test(host)) return "producthunt";
    if (/(^|\.)(chatgpt\.com|openai\.com|claude\.ai|perplexity\.ai|gemini\.google\.com)$/.test(host)) {
      return "ai-assistants";
    }
    return host.slice(0, 80);
  } catch {
    return "direct";
  }
}

/** A human label for a referrer bucket. */
export function sourceLabel(host: string): string {
  const map: Record<string, string> = {
    direct: "Direct / no referrer",
    internal: "On-site navigation",
    google: "Google Search",
    search: "Other search engines",
    x: "X (Twitter)",
    linkedin: "LinkedIn",
    reddit: "Reddit",
    hackernews: "Hacker News",
    producthunt: "Product Hunt",
    "ai-assistants": "AI assistants",
  };
  return map[host] || host;
}
