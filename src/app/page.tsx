import Link from "next/link";
import { ArrowRight, Check, Clock, Link2, Sparkles, Trophy } from "lucide-react";
import { Card, Rubric, LinkButton, Empty } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { WeekTabs } from "@/components/week-tabs";
import { Countdown } from "@/components/countdown";
import { AdRail, AdSlotsSection } from "@/components/ad-rail";
import { HeroLauncher } from "@/components/hero-launcher";
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
import { FREE_PERKS, PREMIUM_ONLY, PRODUCTS } from "@/lib/pricing";

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
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink-900/12 bg-paper-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-moss-500" />
              {weekLabel(currentWeekKey())} · {first ? "our first week" : "live now"}
            </span>

            <h1 className="mx-auto max-w-2xl font-serif text-display font-semibold text-ink-900">
              Launch your SaaS.
              <br />
              <span className="text-oxblood-500">Get your first users.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-ink-500">
              Paste your URL. We write the listing, you&apos;re on the board in a minute — with a
              dofollow backlink that lasts.
            </p>

            <div className="mt-9">
              <HeroLauncher />
            </div>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
              Free forever · no card · one minute
            </p>
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
                        ? "No launches yet — the number one spot is genuinely unclaimed right now."
                        : "Pick another week from the strip above."
                    }
                    action={live ? <LinkButton href="/launch">Be the first entry</LinkButton> : undefined}
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
              Ranked by upvotes. Nothing above can be bought.
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
                title: "Upvote 3 makers",
                body: "Support the board before you join it. That's why the votes mean something.",
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                title: "Publish & climb",
                body: "You're live with a permanent page and a backlink that outlasts the week.",
              },
            ].map((s, i) => (
              <div key={s.title} className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oxblood-500/10 text-oxblood-600">
                  {s.icon}
                </span>
                <p className="mt-4 font-mono text-[10px] text-ink-400">0{i + 1}</p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[240px] text-[14px] leading-relaxed text-ink-500">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <LinkButton href="/launch" size="lg" className="gap-2">
              Launch for free <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ═══ WHAT IT COSTS — free vs premium ═════════════════ */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-lg text-center">
          <Rubric className="mb-4 justify-center">What it costs</Rubric>
          <h2 className="font-serif text-masthead font-semibold text-ink-900">
            Launching is free. It stays free.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
            Money comes from sponsor slots, not from you.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-xl font-semibold text-ink-900">Free</h3>
              <span className="figure text-2xl font-semibold text-ink-900">$0</span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
              forever · one launch a week
            </p>
            <ul className="mt-5 space-y-2.5">
              {FREE_PERKS.slice(0, 4).map((p) => (
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
                <span className="ml-1 text-[13px] font-normal text-ink-400">/mo</span>
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
              cancel any time
            </p>
            <ul className="mt-5 space-y-2.5">
              {PREMIUM_ONLY.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-500" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
          >
            Full pricing — Featured, sidebar, directory blast <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* ═══ ADVERTISE ═══════════════════════════════════════ */}
      <section id="advertise" className="border-y border-ink-900/12 bg-paper-100">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-lg text-center">
            <Rubric className="mb-4 justify-center">Advertise</Rubric>
            <h2 className="font-serif text-masthead font-semibold text-ink-900">
              Two slots. Real scarcity.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
              Dofollow, sold by the week or the month. Live inventory below.
            </p>
          </div>

          <div className="mt-10">
            <AdSlotsSection />
          </div>
        </div>
      </section>

      {/* ═══ CLOSE ═══════════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-serif text-masthead font-semibold text-ink-900">
          {first ? "Week 1 has no history to beat." : `The top of ${weekLabel(currentWeekKey())} is open.`}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
          One URL, one minute, a permanent page behind you.
        </p>
        <div className="mt-8">
          <HeroLauncher />
        </div>

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
