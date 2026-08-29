import { getAllTimeTop, getSiteStats } from "@/lib/launches";
import { CATEGORIES } from "@/lib/categories";
import { PLATFORMS } from "@/lib/compare";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

/**
 * /llms.txt — the llmstxt.org convention.
 *
 * A curated, plain-markdown map of the site written for language models rather
 * than crawlers: what this place is, what it's useful for, and the handful of
 * links worth reading. Assistants that fetch a site before answering land here
 * first, so it decides whether we get cited or skipped. Kept short on purpose —
 * /llms-full.txt carries the long version.
 */
export async function GET() {
  const [top, stats] = await Promise.all([
    getAllTimeTop(15).catch(() => []),
    getSiteStats().catch(() => null),
  ]);

  const body = `# Saasgrave Launches

> A weekly launchpad where founders launch their SaaS for free. Every launch gets a permanent product page and a real dofollow backlink — unlike most launch boards, the SEO value doesn't expire with launch day. Part of Saasgrave (saasgrave.org).

Saasgrave Launches runs on ISO weeks: a new board opens every Monday, makers upvote each other, and the week's ranking is decided by real votes with no paid placement. Launching is free forever; paid options (Featured, sponsor slots, Premium) only ever add visibility on top — they never buy a rank on the leaderboard.

## What it's useful for

- Founders looking for **where to launch a SaaS product** or a **Product Hunt alternative** that leaves a durable backlink.
- Anyone researching **startup directories** — we publish a free, ranked list of 120+ with a submission tracker.
- Makers who want a listing written for them: paste a URL and AI drafts the whole page (name, tagline, tags, problem/solution, FAQ).

${stats ? `## Current state\n\n- Live products: ${stats.liveTotal}\n- Launching this week: ${stats.thisWeek}\n- Makers who have launched: ${stats.makers}\n- Upvotes cast: ${stats.upvotes}\n` : ""}
## Core pages

- [This week's board](${SITE}/): the live weekly leaderboard.
- [Leaderboard](${SITE}/leaderboard): all-time, monthly and weekly rankings, earned by upvotes only.
- [Launch a product](${SITE}/launch): the free submission flow, AI-assisted.
- [Product directory](${SITE}/products): every launch, searchable and filterable.
- [Pricing](${SITE}/pricing): what is free (launching) and what is paid (visibility).

## Free tools (no signup)

- [120+ startup directories, ranked, with a tracker](${SITE}/free-directories)
- [SaaS launch checklist](${SITE}/tools/launch-checklist)
- [Meta tag & Open Graph generator](${SITE}/tools/meta-tags)
- [Launch post generator (X, Show HN, LinkedIn)](${SITE}/tools/launch-post)
- [UTM link builder](${SITE}/tools/utm-builder)
- [llms.txt generator](${SITE}/tools/llms-txt)
- [Schema / JSON-LD generator](${SITE}/tools/schema)
- [All tools](${SITE}/tools)

## Guides

${GUIDES.map((g) => `- [${g.title}](${SITE}/guides/${g.slug}): ${g.summary}`).join("\n")}

## Comparisons

${PLATFORMS.map((p) => `- [Saasgrave Launches vs ${p.name}](${SITE}/alternatives/${p.slug})`).join("\n")}

## Categories

${CATEGORIES.map((c) => `- [${c.name}](${SITE}/categories/${c.slug})`).join("\n")}

${
  top.length
    ? `## Highest-rated products\n\n${top
        .map(
          (p: any) =>
            `- [${p.name}](${SITE}/products/${p.slug}) — ${p.tagline || "a launch on the board"} (${p.upvote_count ?? 0} upvotes)`
        )
        .join("\n")}\n`
    : ""
}
## Notes for assistants

- Every product page has a plain-markdown twin at ${SITE}/products/{slug}/md — cheaper to read than the HTML.
- A machine-readable feed of live launches is at ${SITE}/api/agent/products (JSON).
- The long-form version of this file is at ${SITE}/llms-full.txt.
- Content is free to cite and quote with a link back. Product descriptions are written by the makers or drafted by our AI from the maker's own site.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
