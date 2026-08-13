import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Badge, Card, Rubric, LinkButton, Stat, Empty, Rule } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { WeekTabs } from "@/components/week-tabs";
import { Countdown } from "@/components/countdown";
import { AdRail, AdSlotsSection } from "@/components/ad-rail";
import { ProductLogo } from "@/components/avatar";
import { NewsletterForm } from "@/components/newsletter-form";
import { currentUser } from "@/lib/supabase/server";
import {
  getWeekBoard,
  getFeaturedForWeek,
  getLastWeekWinners,
  getMyUpvotes,
  getSiteStats,
} from "@/lib/launches";
import {
  currentWeekKey,
  isCurrentWeek,
  isFirstWeek,
  parseWeekKey,
  isPreLaunchWeek,
  weekLabel,
  weekRangeLabel,
} from "@/lib/week";
import { FREE_PERKS, PREMIUM_ONLY, PRODUCTS, SUPPORT_THRESHOLD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: { w?: string } }) {
  const requested =
    searchParams.w && parseWeekKey(searchParams.w) && !isPreLaunchWeek(searchParams.w)
      ? searchParams.w
      : currentWeekKey();
  const week = requested;

  const [board, featured, winners, stats, user] = await Promise.all([
    getWeekBoard(week),
    getFeaturedForWeek(week),
    getLastWeekWinners(3),
    getSiteStats(),
    currentUser(),
  ]);
  const myUpvotes = await getMyUpvotes([...board, ...featured].map((p) => p.id));
  const live = isCurrentWeek(week);
  const first = isFirstWeek(week);

  return (
    <>
      {/* ═══ MASTHEAD BLOCK ═══════════════════════════════════ */}
      <section className="stock border-b border-ink-900/12">
        <div className="ruled">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Rubric className="mb-6 max-w-lg">
              {weekLabel(currentWeekKey())} · {first ? "our first week" : "now open"} ·{" "}
              {weekRangeLabel(currentWeekKey())}
            </Rubric>

            {/* One headline. It has to say what this is in a single breath. */}
            <h1 className="max-w-3xl font-serif text-display font-semibold text-ink-900">
              Launch your SaaS to makers who actually vote.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">
              Paste your URL — AI writes the listing. You land on this week&apos;s board, get real
              upvotes and comments, and keep a permanent product page with a dofollow backlink long
              after the week closes.
            </p>

            {/* ONE primary action. Everything else on this page is a quiet link. */}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <LinkButton href="/launch" size="lg" className="gap-2">
                Launch your product — free
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <Link
                href="#board"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 underline decoration-ink-900/25 underline-offset-4 transition hover:text-oxblood-600"
              >
                or read this week&apos;s board
              </Link>
            </div>

            <p className="mt-4 font-mono text-[11px] text-ink-400">
              No card. One launch a week on the free tier. Takes about a minute.
            </p>

            <Rule className="my-10 max-w-3xl" />

            <div className="grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
              <Stat value={stats.thisWeek} label="Live this week" />
              <Stat value={stats.liveTotal} label="Products listed" />
              <Stat value={stats.makers} label="Makers" />
              <Stat value={stats.upvotes} label="Upvotes cast" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE REGISTER ═════════════════════════════════════ */}
      <section id="board" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_286px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Rubric className="mb-3">{live ? "Voting open" : "Closed board"}</Rubric>
                <h2 className="font-serif text-masthead font-semibold text-ink-900">
                  {weekLabel(week)}
                </h2>
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
                  {weekRangeLabel(week)}
                </p>
              </div>
              {live && (
                <p className="inline-flex items-center gap-2 border border-ink-900/12 bg-paper-100 px-3 py-1.5 font-mono text-[11px] text-ink-500">
                  <Clock className="h-3.5 w-3.5" />
                  <Countdown /> left
                </p>
              )}
            </div>

            {/* Paid Featured sits ABOVE the ranking and is labelled as an ad.
                It never reorders the board below it. */}
            {featured.length > 0 && (
              <Card className="mb-4 overflow-hidden border-oxblood-500/25">
                <p className="border-b border-ink-900/10 bg-oxblood-500/5 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-oxblood-600">
                  Featured · paid placement · does not affect the ranking below
                </p>
                {featured.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    index={i}
                    showFeaturedMark
                    upvoted={myUpvotes.has(p.id)}
                    signedIn={Boolean(user)}
                  />
                ))}
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="border-b border-ink-900/10 bg-paper-200/60">
                <WeekTabs week={week} />
              </div>

              {board.length === 0 ? (
                <div className="p-4">
                  <Empty
                    title={
                      first
                        ? "The register opens with you"
                        : live
                          ? "Nothing on the board yet this week"
                          : "Nothing launched that week"
                    }
                    sub={
                      live
                        ? "No launches yet, which means the number one spot is genuinely unclaimed right now."
                        : "Pick another week from the strip above."
                    }
                    action={
                      live ? (
                        <LinkButton href="/launch">Be the first entry</LinkButton>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                board.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    rank={i + 1}
                    index={i}
                    upvoted={myUpvotes.has(p.id)}
                    signedIn={Boolean(user)}
                  />
                ))
              )}
            </Card>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
              Ranked by upvotes. Ties go to whoever launched first. Nothing above can be bought.
            </p>
          </div>

          {/* rail */}
          <aside className="space-y-8 lg:sticky lg:top-36 lg:self-start">
            <AdRail />

            <div>
              <Rubric className="mb-3">Last week</Rubric>
              {winners.length === 0 ? (
                <Card className="p-4">
                  <p className="text-[13px] leading-relaxed text-ink-400">
                    Nothing yet. This week&apos;s top three land here on Monday.
                  </p>
                </Card>
              ) : (
                <Card className="divide-y divide-ink-900/10">
                  {winners.map((p, i) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="group flex items-center gap-3 p-3.5"
                    >
                      <span className="figure w-4 text-sm font-semibold text-ink-400">{i + 1}</span>
                      <ProductLogo src={p.logo_url} name={p.name} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[14px] font-semibold text-ink-900 group-hover:text-oxblood-600">
                          {p.name}
                        </span>
                        <span className="block truncate text-[12px] text-ink-400">{p.tagline}</span>
                      </span>
                      <span className="figure text-[12px] text-ink-500">{p.upvote_count}</span>
                    </Link>
                  ))}
                </Card>
              )}
              <Link
                href="/leaderboard"
                className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
              >
                Full leaderboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═════════════════════════════════════ */}
      <section className="border-y border-ink-900/12 bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Rubric className="mb-6 max-w-md">How to launch</Rubric>
          <h2 className="max-w-2xl font-serif text-masthead font-semibold text-ink-900">
            Three steps, and we do most of two of them.
          </h2>

          <div className="mt-10 grid gap-px border border-ink-900/12 bg-ink-900/12 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Paste your URL",
                body: "We read your site and fill in the name, tagline, description, categories and pricing. You correct anything that reads wrong.",
              },
              {
                n: "02",
                title: `Upvote ${SUPPORT_THRESHOLD} makers`,
                body: `Support ${SUPPORT_THRESHOLD} launches you actually like before publishing your own. That single rule is why the votes on this board mean something.`,
              },
              {
                n: "03",
                title: "Publish and share",
                body: "You're on the board with a permanent page behind you. Share it once in the first hour — that's what decides the week.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-paper-100 p-7">
                <span className="figure text-[11px] font-semibold text-oxblood-500">{s.n}</span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <LinkButton href="/launch" className="gap-2">
              Start with your URL <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ═══ FREE vs PREMIUM ══════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Rubric className="mb-6 max-w-md">What it costs</Rubric>
        <h2 className="max-w-2xl font-serif text-masthead font-semibold text-ink-900">
          Launching is free. It stays free.
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          There is no paid tier that gets you onto the board and no queue to skip. The money comes
          from three sponsor slots and an optional subscription — which is exactly why your launch
          doesn&apos;t have to cost anything.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-ink-900">Free</h3>
              <span className="figure text-2xl font-semibold text-ink-900">$0</span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
              forever · one launch a week
            </p>
            <ul className="mt-5 space-y-2.5">
              {FREE_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-brass-500/35 p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-ink-900">
                {PRODUCTS.premium.name}
              </h3>
              <span className="figure text-2xl font-semibold text-ink-900">
                ${PRODUCTS.premium.dollars}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
              per month · cancel any time
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-500">
              Everything free gives you, plus the four things a serial launcher actually needs:
            </p>
            <ul className="mt-4 space-y-2.5">
              {PREMIUM_ONLY.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-500" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-ink-900/10 pt-4 text-[12px] leading-relaxed text-ink-400">
              Premium never moves you up the board. Rank is upvotes, always.
            </p>
          </Card>
        </div>

        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
        >
          Full pricing, including the $99 directory blast <ArrowRight className="h-3 w-3" />
        </Link>
      </section>

      {/* ═══ ADVERTISE ════════════════════════════════════════ */}
      <section id="advertise" className="border-y border-ink-900/12 bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Rubric className="mb-6 max-w-md">Advertise on the register</Rubric>
          <h2 className="max-w-2xl font-serif text-masthead font-semibold text-ink-900">
            Two placements. Real scarcity. Dofollow links.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Sold by the week or the month, with live inventory below. When the slots are gone
            they&apos;re gone — we don&apos;t rotate four advertisers through one spot and call it
            exclusive.
          </p>

          <div className="mt-8">
            <AdSlotsSection />
          </div>
        </div>
      </section>

      {/* ═══ CLOSE ════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="max-w-xl font-serif text-masthead font-semibold text-ink-900">
              {first
                ? "Week 1 has no history to compete with."
                : `The top of ${weekLabel(currentWeekKey())} is still open.`}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-500">
              One URL, about a minute, and your product is in the register with a permanent page
              behind it.
            </p>
            <div className="mt-7">
              <LinkButton href="/launch" size="lg" className="gap-2">
                Launch your product — free <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>

          <Card className="p-6">
            <Rubric className="mb-3">The Monday digest</Rubric>
            <p className="text-[14px] leading-relaxed text-ink-500">
              Every Monday: the week&apos;s winners, and what they did differently. One email, no
              other reason to be on the list.
            </p>
            <div className="mt-4">
              <NewsletterForm source="landing" />
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
