import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge, Card, Rubric, LinkButton, Stat, Rule } from "@/components/ui";
import { BuyButton } from "@/components/buy-button";
import { TrackOnMount } from "@/components/tracker";
import { getAvailability, getFeaturedAvailability } from "@/lib/ads";
import { getSiteStats } from "@/lib/launches";
import { FREE_LAUNCHES_PER_WEEK, FREE_PERKS, PRODUCTS } from "@/lib/pricing";
import { currentWeekKey, monthLabel, weekLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — free to launch, $19 to sponsor, $29 for Premium",
  description:
    "Launching is free forever. Featured is $9 for your launch week, sidebar slots are $19/month, Premium is $29/month for unlimited launches and full analytics, and we'll submit you to 100+ directories by hand for $99.",
};

export default async function PricingPage() {
  const week = currentWeekKey();
  const [sidebar, featured, stats] = await Promise.all([
    getAvailability(3),
    getFeaturedAvailability(week),
    getSiteStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <TrackOnMount event="pricing_view" />

      <Rubric className="mb-6 max-w-sm">Rate card</Rubric>
      <h1 className="max-w-3xl font-serif text-display font-semibold text-ink-900">
        Launching is free. Everything else is optional.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
        There is no paid tier that gets you onto the board, no queue to skip, and no paywall between
        your product and the people browsing. Four things cost money, and each one is listed below
        with its real inventory.
      </p>

      <Rule className="my-10 max-w-2xl" />
      <div className="grid max-w-xl grid-cols-3 gap-8">
        <Stat value={stats.liveTotal} label="Products listed" />
        <Stat value={stats.makers} label="Makers" />
        <Stat value={stats.upvotes} label="Upvotes cast" />
      </div>

      {/* ── free ── */}
      <section className="mt-16">
        <Rubric className="mb-6">The free tier</Rubric>
        <Card className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-ink-900">Free Launch</h2>
              <Badge tone="moss">no card</Badge>
            </div>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="figure text-5xl font-semibold text-ink-900">$0</span>
              <span className="text-sm text-ink-400">forever</span>
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
              {FREE_LAUNCHES_PER_WEEK} launch per week. Everything you need to go live and stay live
              — and it never expires.
            </p>
            <LinkButton href="/launch" size="lg" className="mt-7 w-full sm:w-auto">
              Launch for free
            </LinkButton>
          </div>
          <ul className="grid gap-3 self-center">
            {FREE_PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── premium ── */}
      <section className="mt-14">
        <Rubric className="mb-6">The subscription</Rubric>
        <Card className="grid gap-8 border-brass-500/40 p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-ink-900">
                {PRODUCTS.premium.name}
              </h2>
              <Badge tone="brass">most picked</Badge>
            </div>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="figure text-5xl font-semibold text-ink-900">
                ${PRODUCTS.premium.dollars}
              </span>
              <span className="text-sm text-ink-400">{PRODUCTS.premium.unit}</span>
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
              {PRODUCTS.premium.tagline}
            </p>
            <BuyButton
              product="premium"
              label={`Get Premium — $${PRODUCTS.premium.dollars}/mo`}
              variant="ink"
              className="mt-7 w-full sm:w-auto"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
              Cancel any time. Premium never moves you up the board — rank is upvotes, always.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {PRODUCTS.premium.perks.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brass-500" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── slots ── */}
      <section id="slots" className="mt-14 scroll-mt-32">
        <Rubric className="mb-6">Placements · live inventory</Rubric>
        <h2 className="max-w-2xl font-serif text-masthead font-semibold text-ink-900">
          Two slots, and they genuinely run out.
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Featured — weekly */}
          <Card className="flex flex-col p-7">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-ink-900">
                {PRODUCTS.featured.name}
              </h3>
              <Badge tone={featured.open > 0 ? "moss" : "neutral"}>
                {featured.open > 0 ? `${featured.open} of ${featured.total} open` : "Sold out"}
              </Badge>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              {PRODUCTS.featured.tagline}
            </p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="figure text-3xl font-semibold text-ink-900">
                ${PRODUCTS.featured.dollars}
              </span>
              <span className="text-[13px] text-ink-400">{PRODUCTS.featured.unit}</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {PRODUCTS.featured.perks.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13px] text-ink-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-ink-900/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                {weekLabel(week)}
              </p>
              <p className="mt-1 font-mono text-[12px] text-ink-500">
                {featured.open}/{featured.total} slots open
              </p>
            </div>

            <BuyButton
              product="featured"
              label={`Feature my launch — $${PRODUCTS.featured.dollars}`}
              soldOut={featured.open === 0}
              className="mt-5 w-full"
            />
          </Card>

          {/* Sidebar — monthly */}
          <Card className="flex flex-col p-7">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-ink-900">
                {PRODUCTS.sidebar.name}
              </h3>
              <Badge tone={(sidebar[0]?.open ?? 0) > 0 ? "moss" : "neutral"}>
                {(sidebar[0]?.open ?? 0) > 0
                  ? `${sidebar[0].open} of ${sidebar[0].total} open`
                  : "Sold out"}
              </Badge>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              {PRODUCTS.sidebar.tagline}
            </p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="figure text-3xl font-semibold text-ink-900">
                ${PRODUCTS.sidebar.dollars}
              </span>
              <span className="text-[13px] text-ink-400">{PRODUCTS.sidebar.unit}</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {PRODUCTS.sidebar.perks.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13px] text-ink-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-ink-900/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                Next three months
              </p>
              <ul className="mt-2 space-y-1">
                {sidebar.map((a) => (
                  <li key={a.monthKey} className="flex items-center justify-between text-[12px]">
                    <span className="text-ink-500">{monthLabel(a.monthKey)}</span>
                    <span
                      className={
                        a.open === 0 ? "font-mono text-ink-400" : "font-mono text-moss-600"
                      }
                    >
                      {a.open}/{a.total} open
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <BuyButton
              product="sidebar"
              label={`Book a slot — $${PRODUCTS.sidebar.dollars}/mo`}
              soldOut={(sidebar[0]?.open ?? 0) === 0}
              className="mt-5 w-full"
            />
          </Card>
        </div>
      </section>

      {/* ── directory blast ── */}
      <section id="directories" className="mt-14 scroll-mt-32">
        <Rubric className="mb-6">Done for you</Rubric>
        <Card className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink-900">
              {PRODUCTS.directory.name}
            </h2>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="figure text-5xl font-semibold text-ink-900">
                ${PRODUCTS.directory.dollars}
              </span>
              <span className="text-sm text-ink-400">one-off</span>
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
              {PRODUCTS.directory.tagline} Submitted personally — not by a script that fills in the
              wrong fields and gets your listing rejected.
            </p>
            <BuyButton
              product="directory"
              label={`Order the blast — $${PRODUCTS.directory.dollars}`}
              className="mt-7 w-full sm:w-auto"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
              You need a live launch first — that&apos;s the listing we submit.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {PRODUCTS.directory.perks.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── faq ── */}
      <section className="mt-14">
        <Rubric className="mb-6">Questions</Rubric>
        <Card className="divide-y divide-ink-900/10">
          {[
            [
              "Is launching really free?",
              `Yes. A public product page, a place on the week's board, comments, a dofollow backlink and your basic analytics — all free, no card, forever. The free tier allows ${FREE_LAUNCHES_PER_WEEK} launch a week.`,
            ],
            [
              "What does Premium actually change?",
              "Four things: unlimited launches instead of one a week, the full analytics dashboard with daily charts and referrers, the AI Launch Copilot on every draft, and a verified badge. It does not change your position on the board.",
            ],
            [
              "Why do I have to upvote three products first?",
              "Because a board where everyone submits and nobody votes is a spam list. Three upvotes takes a minute, and it's the only reason the ranking here means anything.",
            ],
            [
              "Is Featured the same as being ranked first?",
              "No, and that distinction matters. Featured is a paid placement in a labelled strip above the board. The ranking underneath is upvotes only, and a Featured product still appears at its real position in it.",
            ],
            [
              "Is the backlink really dofollow?",
              "Yes — on your canonical product page and on every sponsor slot. It's the thing being offered, and nofollowing it would make the whole exercise pointless.",
            ],
            [
              "What happens when my week ends?",
              "Nothing disappears. Your product page, its link, its comments and its rank stay live and indexed. The board simply moves to the next week.",
            ],
            [
              "Refunds?",
              "Sponsor slots are refundable pro-rata before the period starts. Premium can be cancelled any time and runs to the end of the month you paid for. The directory blast is refundable until we start submitting.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="group p-6">
              <summary className="cursor-pointer list-none font-serif text-[16px] font-semibold text-ink-900 marker:hidden">
                {q}
              </summary>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">{a}</p>
            </details>
          ))}
        </Card>
      </section>

      <section className="mt-14 border-t border-ink-900/12 pt-10">
        <h2 className="max-w-xl font-serif text-masthead font-semibold text-ink-900">
          Start with the free one.
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-500">
          Everything paid here is built to compound after launch week. None of it is needed to get
          on the board.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <LinkButton href="/launch" size="lg">
            Launch for free
          </LinkButton>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 underline decoration-ink-900/25 underline-offset-4 hover:text-ember-600"
          >
            or read this week&apos;s board
          </Link>
        </div>
      </section>
    </div>
  );
}
