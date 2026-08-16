import Link from "next/link";
import { ArrowRight, Clock, Link2, Sparkles, Trophy, Users, TrendingUp, Check, X } from "lucide-react";
import { Card, Rubric, LinkButton, Empty } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { WeekTabs } from "@/components/week-tabs";
import { Countdown } from "@/components/countdown";
import { AdRail, FeedAd } from "@/components/ad-rail";
import { HeroLauncher } from "@/components/hero-launcher";
import { ProductLogo } from "@/components/avatar";
import { NewsletterForm } from "@/components/newsletter-form";
import { Reveal } from "@/components/reveal";
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
import { PRODUCTS } from "@/lib/pricing";

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
      {/* ═══ HERO — one headline, one action, centered ═══════ */}
      <section className="stock border-b border-ink-900/12">
        <div className="ruled">
          <div className="hero-wash mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="rise mb-7 inline-flex items-center gap-2 rounded-full border border-ink-900/12 bg-paper-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500 shadow-page">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-moss-500" />
              {weekLabel(currentWeekKey())} · {first ? "our first week" : "live now"}
            </span>

            <h1
              className="rise mx-auto max-w-2xl font-serif text-display font-semibold text-ink-900"
              style={{ animationDelay: "70ms" }}
            >
              You built it.
              <br />
              <span className="text-ember-500">Now get it seen.</span>
            </h1>

            <p
              className="rise mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500"
              style={{ animationDelay: "150ms" }}
            >
              Paste your URL. Our AI writes the whole listing, and you&apos;re on this week&apos;s
              board in about a minute — in front of real makers, with a{" "}
              <strong className="font-semibold text-ink-700">permanent dofollow backlink</strong>{" "}
              that keeps working long after launch day.
            </p>

            <div className="rise mt-9" style={{ animationDelay: "230ms" }}>
              <HeroLauncher />
            </div>

            <p
              className="rise mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400"
              style={{ animationDelay: "310ms" }}
            >
              Free forever · no card · one minute
            </p>

            {/* Quiet social proof: real makers already on the board. */}
            {(winners.length > 0 || board.length > 0) && (
              <div
                className="rise mt-10 flex items-center justify-center gap-3"
                style={{ animationDelay: "390ms" }}
              >
                <div className="flex -space-x-2">
                  {[...winners, ...board]
                    .slice(0, 5)
                    .map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full ring-2 ring-paper-50"
                        title={p.name}
                      >
                        <ProductLogo src={p.logo_url} name={p.name} size={30} />
                      </span>
                    ))}
                </div>
                <span className="text-[13px] text-ink-500">
                  <strong className="text-ink-900">{stats.liveTotal}</strong> products ·{" "}
                  <strong className="text-ink-900">{stats.makers}</strong> makers ·{" "}
                  <strong className="text-ink-900">{stats.upvotes}</strong> upvotes
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ THE BOARD — right below the hero ═════════════════ */}
      <section id="board" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_286px]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Rubric className="mb-3">{live ? "This week" : "Past week"}</Rubric>
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

            {featured.length > 0 && (
              <Card className="mb-4 overflow-hidden border-ember-500/25">
                <p className="border-b border-ink-900/10 bg-ember-500/5 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-600">
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

            <Card className="overflow-hidden shadow-lift">
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
                        ? "No launches yet — the number one spot is genuinely unclaimed right now."
                        : "Pick another week from the strip above."
                    }
                    action={live ? <LinkButton href="/launch">Be the first entry</LinkButton> : undefined}
                  />
                </div>
              ) : (
                // The board is a self-contained box: the ranked list scrolls
                // INSIDE it, the page stays put. It's a live leaderboard
                // preview — and nothing in it is for sale.
                <div className="board-scroll max-h-[560px] overflow-y-auto overscroll-contain">
                  {board.map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      rank={i + 1}
                      index={i}
                      upvoted={myUpvotes.has(p.id)}
                      signedIn={Boolean(user)}
                    />
                  ))}
                </div>
              )}
            </Card>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
              Ranked by upvotes. Nothing here can be bought.
            </p>

            {/* The Prime slot sits OUTSIDE the ranked box — an ad is never part
                of the leaderboard. The rail carries the sidebar slots. */}
            <div className="mt-6">
              <FeedAd />
            </div>
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
                        <span className="block truncate font-serif text-[14px] font-semibold text-ink-900 group-hover:text-ember-600">
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
                className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ember-600 hover:underline"
              >
                Full leaderboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══ WHAT YOU GET — outcomes, not features ═══════════ */}
      <section className="border-t border-ink-900/12">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <Rubric className="mb-4 justify-center">Why launch here</Rubric>
              <h2 className="font-serif text-masthead font-semibold text-ink-900">
                Three things every launch gets.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
                Not a wall of features — the three outcomes that actually move a new product.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: <Users className="h-5 w-5" />,
                title: "Real first users",
                body: "Your listing lands in front of the makers browsing this week's board — the people most likely to actually try a new tool and tell you what's broken.",
              },
              {
                icon: <Link2 className="h-5 w-5" />,
                title: "A permanent dofollow backlink",
                body: "Not nofollowed, not gone in a week. A real SEO link on your product page that stays live and indexed for good — the thing that keeps sending traffic.",
              },
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: "A ranking you can win",
                body: "Ranked by real upvotes, never pay-to-win. Land the weekly top three and you're written up in Sunday's email to every maker here.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 110}>
                <Card className="flex h-full flex-col p-6 transition hover:shadow-lift">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember-500/10 text-ember-600">
                    {c.icon}
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-ink-900">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{c.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>

          {/* Make the switch obvious — an honest comparison (Marc #31). */}
          <Reveal>
            <div className="mx-auto mt-10 max-w-3xl">
              <Card className="grid gap-px overflow-hidden bg-ink-900/10 sm:grid-cols-2">
                <div className="bg-paper-100 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
                    Posting once, somewhere
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "Scrolls off the feed by tomorrow",
                      "Link is nofollow, or gone in a week",
                      "You write the whole listing yourself",
                      "Ranked by an algorithm you can't see",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-[14px] text-ink-500">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-paper-100 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ember-600">
                    Launching here
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      "A permanent page that keeps ranking",
                      "A real dofollow backlink, forever",
                      "AI writes your listing in a minute",
                      "Ranked by honest upvotes you can win",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-[14px] text-ink-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — three tight steps ═════════════════ */}
      <section className="border-y border-ink-900/12 bg-paper-100">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-lg text-center">
            <Rubric className="mb-4 justify-center">How it works</Rubric>
            <h2 className="font-serif text-masthead font-semibold text-ink-900">
              Live in three steps.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Link2 className="h-5 w-5" />,
                title: "Paste your URL",
                body: "AI writes the listing from your site. You fix anything wrong.",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: "Review the draft",
                body: "Fix the tagline, add a screenshot. Two minutes and it reads like you wrote it.",
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                title: "Publish & climb",
                body: "You're live with a permanent page and a backlink that outlasts the week.",
              },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 110} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ember-500/10 text-ember-600 transition-transform hover:scale-110">
                  {s.icon}
                </span>
                <p className="mt-4 font-mono text-[10px] text-ink-400">0{i + 1}</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[240px] text-[14px] leading-relaxed text-ink-500">
                  {s.body}
                </p>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <LinkButton href="/launch" size="lg" className="gap-2">
              Launch for free <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ═══ PRICING POINTER — the detail lives on /pricing ══ */}
      <section className="border-y border-ink-900/12 bg-paper-100">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-14 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div>
            <Rubric className="mb-3 justify-center sm:justify-start">Pricing</Rubric>
            <h2 className="font-serif text-section font-semibold text-ink-900">
              Free to launch. Pay only to stand out.
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-500">
              Premium is ${PRODUCTS.premium.dollars}/mo for unlimited launches, analytics and the AI
              Copilot. Ad slots and the directory blast are on the pricing page.
            </p>
          </div>
          <LinkButton href="/pricing" size="lg" variant="outline" className="shrink-0 gap-2">
            See pricing <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>

      {/* ═══ CLOSE ═══════════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Reveal>
          <h2 className="font-serif text-masthead font-semibold text-ink-900">
            {first ? "Week 1 has no history to beat." : `The top of ${weekLabel(currentWeekKey())} is open.`}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
            One URL, one minute, a permanent page behind you.
          </p>
          <div className="mt-8">
            <HeroLauncher />
          </div>
        </Reveal>

        <div className="mx-auto mt-14 max-w-md border-t border-ink-900/12 pt-10">
          <Rubric className="mb-3 justify-center">The Monday digest</Rubric>
          <p className="mb-4 text-[14px] leading-relaxed text-ink-500">
            The week&apos;s winners, once a week. Nothing else.
          </p>
          <NewsletterForm source="landing" />
        </div>
      </section>
    </>
  );
}
