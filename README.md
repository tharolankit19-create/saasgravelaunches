# Saasgrave Launches

A weekly launchpad for makers who ship. This isn't a separate product — it's a
launchpad **feature of [Saasgrave](https://saasgrave.org)** that lives on its own
subdomain, running against the **same Supabase project**. Anyone already signed
in to Saasgrave can launch here without creating anything new.

Paste a URL, AI writes the listing, and you're on this week's board in about a
minute. Launching is free forever; the money comes from three sponsor slots in
the rail.

---

## One database, two surfaces

`profiles` is shared and stays shared: one row per person, used by both sites.
What differs is what each surface **asks for** and **shows** — Saasgrave collects
its founder fields (`failed_count`, `fail_reasons`, `location`, …) and renders
those; Launches collects its maker fields (`maker_headline`, `github_handle`) and
renders those. Neither reaches into the other's.

Everything else the launchpad owns is namespaced `launch_*`, so it can never
collide with Saasgrave's `startups`, `payments`, `offers`, `ad_slots` or
`community_*`. Its RPCs are namespaced too (`toggle_launch_upvote`,
`increment_launch_view`) alongside Saasgrave's `toggle_post_like` and
`increment_view`.

`supabase/schema.sql` carries a **safety contract** in its header: strictly
additive, never a `DROP`/`REPLACE`/destructive `ALTER` on anything Saasgrave
owns. Shared plumbing — the `handle_new_user` signup trigger, the
`storage.objects` policies — is created only when missing, guarded by existence
checks rather than the usual DROP-then-CREATE, because a DROP that succeeds
paired with a CREATE that fails would take Saasgrave's signups or uploads down
with it. Safe to run on the live project, and safe to re-run.

---

## What's here

| Surface | Route | What it does |
| --- | --- | --- |
| Weekly board | `/` and `/?w=2026-W33` | This week's launches, ranked by upvotes. Past weeks are browsable. |
| Product page | `/products/[slug]` | The SEO page: gallery, overview, FAQ, discussion, **dofollow** outbound link, `SoftwareApplication` + `FAQPage` JSON-LD, per-product OG image. |
| Directory | `/products`, `/categories/[slug]` | Every live launch, searchable and filterable. |
| Leaderboard | `/leaderboard` | All-time top launches plus each past week's winners. |
| Maker profile | `/makers/[id]` | Someone's launches and totals. Reads the shared `profiles` row. |
| Submit | `/launch` | URL → autofill → five fields → live. |
| Dashboard | `/dashboard` | Views, upvotes, comments, outbound clicks, sponsor slots, profile editing. |
| Pricing | `/pricing` | Free tier, the two ad placements with live availability, Premium. |
| Admin | `/admin` | Traffic diagnosis: funnel drop-off, referrers, friction, and what to do. |
| Badge | `/api/badge?slug=…` | The embeddable "Featured on Saasgrave Launches" SVG. |

## The compounding loop

A launch that ends when the week ends isn't worth much, so two features exist to
keep it earning:

**The embeddable badge.** `/api/badge?slug=…&theme=light|dark` serves an SVG a
maker drops on their own site, showing their live rank and upvote count. The
product page sends them a dofollow link; the badge sends one back, and every
visitor to their site learns the launchpad exists. Owners get the badge plus
copy-paste HTML and Markdown on their own product page. Arrivals through it
carry `?ref=badge` and are counted in `badge_clicks`, separately from ordinary
views, so a maker can see whether putting it up was worth it.

**The share kit.** Launches are won in the first hour by the maker telling
people, and the thing that stops them is the blank box. So the post is
pre-written in the three shapes that actually get posted — launch day, the rank,
and the ask for feedback — each with one-click Post on X and Copy.

**Editor's pick** (`featured`) is a badge and nothing more. It never moves a
product up the board and it isn't for sale; the pricing page promises the ranking
can't be bought, so `POST /api/admin/featured` is admin-session-only and is
deliberately *not* reachable with the read-only insights bearer token.

## The one rule

A maker must upvote **3 other people's launches** before publishing their own
(`SUPPORT_THRESHOLD` in `src/lib/pricing.ts`). It's enforced in the API, not
just the UI, and it's the reason the ranking means anything. A maker can put at
most 2 products on a single week's board.

## Stack

Next.js 14 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind ·
Dodo Payments · OpenRouter. No component library, no ORM, no state manager.

## Setup

```bash
cp .env.example .env.local     # fill it in — see the comments in that file
npm install
npm run dev
```

Then run `supabase/schema.sql` in the Supabase SQL editor — see the safety
contract above for why it's safe against the live project.

> Already applied to the live Saasgrave project. All seven
> `launch_*` tables, their RLS policies and RPCs are in place, and every
> Saasgrave row count was verified unchanged before and after: 53 profiles /
> auth users, 17 startups, 108 payments, 12 ad_slots, 3 offers, 3 community
> likes, 1 community post, 1 newsletter subscriber. The signup trigger and all
> four `storage.objects` policies were confirmed untouched.

Enable Google as an auth provider in Supabase → Authentication → Providers, and
add `https://<your-domain>/auth/callback` to the redirect allow-list.

### Deploying to the subdomain

Point `launches.saasgrave.org` at this Vercel project and set
`NEXT_PUBLIC_SITE_URL` to match. The Saasgrave app stays exactly as it is —
these are two deployments over one database.

## How the pieces work

**Autofill** (`src/lib/autofill.ts`) runs in two stages. First it scrapes the
page for facts that are already there — title, OG tags, headings, body copy,
favicon. Then a small model turns those into listing fields. The second stage is
optional: with no `OPENROUTER_API_KEY`, or a rate-limited model, the maker still
lands on a filled-in form instead of an error. The scraper refuses private and
link-local addresses, so the endpoint can't be used as a proxy.

**Models** (`src/lib/ai.ts`) are a ladder of free OpenRouter models tried in
order — `nvidia/nemotron-3.5-lightning:free`, `liquid/lfm-2.5-2.6b:free`,
`inclusionai/ling-3.0-tiny:free`. A 404 or 429 falls through to the next rung.

**Payments** resolve every price server-side from `src/lib/pricing.ts`; the
browser only ever sends a product key. The webhook verifies its Standard
Webhooks signature and **refuses to fulfil** if `DODO_WEBHOOK_SECRET` is unset —
the success page reconciles directly with Dodo either way, so a missing secret
delays fulfilment rather than breaking it. Fulfilment is idempotent.

**Telemetry** (`src/lib/analytics.ts`) is a single `launch_events` table: no
cookies, no third party, one random per-tab session id. `src/lib/insights.ts`
turns it into funnel drop-off, referrer attribution (one source per session) and
a set of rule-based findings, each with the action it implies.

## The Hermes watcher

`GET /api/admin/insights?days=7&narrate=1`, with
`Authorization: Bearer $ADMIN_INSIGHTS_TOKEN`, returns the whole diagnosis as
JSON — totals, funnel, sources, friction and findings, plus a short AI-written
summary when `narrate=1`. The rules produce the findings; the model only
rephrases them, so an unset AI key costs you the prose and nothing else.

The matching Hermes skill lives in the `hermes-agent` repo at
`skills/productivity/saasgrave-launches/`.

```bash
curl -s -H "Authorization: Bearer $ADMIN_INSIGHTS_TOKEN" \
  "https://launches.saasgrave.org/api/admin/insights?days=7&narrate=1" | jq .findings
```

Admin access in the browser is keyed on `profiles.is_admin`, read through the
service role — same flag Saasgrave uses.
