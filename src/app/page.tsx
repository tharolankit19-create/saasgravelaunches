import Link from "next/link";
import { ArrowRight, Sparkles, Link2, Trophy, Clock } from "lucide-react";
import { Badge, Card, Eyebrow, LinkButton, Stat, Empty } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { WeekTabs } from "@/components/week-tabs";
import { Countdown } from "@/components/countdown";
import { AdRail, FeedBanner } from "@/components/ad-rail";
import { ProductLogo } from "@/components/avatar";
import { currentUser } from "@/lib/supabase/server";
import {
  getWeekBoard,
  getLastWeekWinners,
  getMyUpvotes,
  getSiteStats,
} from "@/lib/launches";
import { currentWeekKey, isCurrentWeek, parseWeekKey, weekLabel, weekRangeLabel } from "@/lib/week";
import { FREE_PERKS, SUPPORT_THRESHOLD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { w?: string };
}) {
  const requested = searchParams.w && parseWeekKey(searchParams.w) ? searchParams.w : currentWeekKey();
  const week = requested;

  const [board, winners, stats, user] = await Promise.all([
    getWeekBoard(week),
    getLastWeekWinners(3),
    getSiteStats(),
    currentUser(),
  ]);
  const myUpvotes = await getMyUpvotes(board.map((p) => p.id));
  const live = isCurrentWeek(week);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="deck-wash border-b border-ink-900/8">
        <div className="deck-grid">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <Badge tone="signal" className="mb-5">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-signal-500" />
              {weekLabel(currentWeekKey())} is live · closes in <Countdown className="font-mono" />
            </Badge>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink-900 sm:text-6xl">
              Launch your SaaS in a minute.
              <br />
              <span className="text-violet-500">Keep the backlink forever.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Paste your URL — we read your site and write the whole listing. Land on this week&apos;s
              board, get real upvotes and comments from other makers, and walk away with a permanent
              product page and a dofollow link. Free, forever.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/launch" size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Launch for free
              </LinkButton>
              <LinkButton href="#board" variant="outline" size="lg">
                See this week&apos;s board
              </LinkButton>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {FREE_PERKS.slice(0, 3).map((p) => (
                <li key={p} className="flex items-center gap-2 text-[13px] text-ink-500">
                  <span className="h-1 w-1 rounded-full bg-violet-500" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-900/8 pt-6">
              <Stat value={stats.liveTotal} label="Products live" />
              <Stat value={stats.thisWeek} label="Launched this week" />
              <Stat value={stats.upvotes} label="Upvotes cast" />
            </div>
          </div>
        </div>
      </section>

      {/* ── board + rail ─────────────────────────────────── */}
      <section id="board" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow className="mb-2">
                  {live ? "Live board" : "Closed board"}
                </Eyebrow>
                <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                  {weekLabel(week)}
                  {live && (
                    <span className="ml-2 align-middle text-[13px] font-normal text-signal-600">
                      · voting open
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{weekRangeLabel(week)}</p>
              </div>
              {live && (
                <p className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/8 bg-paper-100 px-3 py-1.5 font-mono text-[12px] text-ink-500">
                  <Clock className="h-3.5 w-3.5" />
                  <Countdown /> left
                </p>
              )}
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-ink-900/6 bg-paper-200/40">
                <WeekTabs week={week} />
              </div>

              {board.length === 0 ? (
                <div className="p-4">
                  <Empty
                    title={live ? "Nothing launched yet this week" : "Nothing launched that week"}
                    sub={
                      live
                        ? "Be the first name on the board — the top spot is genuinely open right now."
                        : "Pick another week from the tabs above."
                    }
                    action={live ? <LinkButton href="/launch">Launch yours</LinkButton> : undefined}
                  />
                </div>
              ) : (
                <>
                  {board.slice(0, 3).map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      rank={i + 1}
                      index={i}
                      upvoted={myUpvotes.has(p.id)}
                      signedIn={Boolean(user)}
                    />
                  ))}

                  {board.length > 3 && <FeedBanner />}

                  {board.slice(3).map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      rank={i + 4}
                      index={i + 3}
                      upvoted={myUpvotes.has(p.id)}
                      signedIn={Boolean(user)}
                    />
                  ))}
                </>
              )}
            </Card>

            {board.length > 0 && (
              <p className="mt-3 px-1 text-[12px] text-ink-400">
                Ranked by upvotes. Ties go to whoever launched first — you can&apos;t buy a rank
                here.
              </p>
            )}
          </div>

          {/* right rail */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <AdRail />

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-medal-500" />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                  Last week&apos;s best
                </p>
              </div>
              {winners.length === 0 ? (
                <p className="mt-3 text-[13px] text-ink-400">
                  Nothing yet — this week&apos;s winners land here on Monday.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {winners.map((p, i) => (
                    <li key={p.id}>
                      <Link href={`/products/${p.slug}`} className="group flex items-center gap-3">
                        <ProductLogo src={p.logo_url} name={p.name} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 group-hover:text-violet-600">
                            {p.name}
                            <span className="text-[11px]">{["🥇", "🥈", "🥉"][i]}</span>
                          </span>
                          <span className="block truncate text-[12px] text-ink-400">{p.tagline}</span>
                        </span>
                        <span className="font-mono text-[12px] text-ink-500">{p.upvote_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/leaderboard"
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-violet-600 hover:underline"
              >
                Full leaderboard <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          </aside>
        </div>
      </section>

      {/* ── how it works ─────────────────────────────────── */}
      <section className="border-y border-ink-900/8 bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Eyebrow className="mb-3">How it works</Eyebrow>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Three steps, and two of them are us doing the work.
          </h2>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: <Link2 className="h-4 w-4" />,
                title: "Paste your URL",
                body: "We read your site and fill in the name, tagline, description, categories and pricing. You edit anything that reads wrong.",
              },
              {
                n: "02",
                icon: <Sparkles className="h-4 w-4" />,
                title: `Support ${SUPPORT_THRESHOLD} makers, then publish`,
                body: `Upvote ${SUPPORT_THRESHOLD} launches you actually like. That one rule is why this board has real votes on it instead of a wall of drive-by submissions.`,
              },
              {
                n: "03",
                icon: <Trophy className="h-4 w-4" />,
                title: "Climb the week, keep the page",
                body: "Your product competes for the week. When the week ends, the page, the backlink and the discussion stay live and keep ranking.",
              },
            ].map((s) => (
              <Card key={s.n} className="p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600">
                    {s.icon}
                  </span>
                  <span className="font-mono text-[11px] text-ink-400">{s.n}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── why here ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Eyebrow className="mb-3">Why launch here</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Most launch sites give you one loud day and a nofollow link.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              A spike of traffic on a Tuesday is nice. It is not a growth channel. What compounds is
              a page that ranks, a link search engines actually follow, and a handful of people who
              tried the thing and told you what was wrong with it.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              That&apos;s all this is built to do — and it costs nothing, because the money comes
              from three sponsor slots in the rail, not from you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/launch" className="gap-2">
                Launch for free <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/pricing" variant="outline">
                See the sponsor slots
              </LinkButton>
            </div>
          </div>

          <Card className="divide-y divide-ink-900/8">
            {[
              ["Free to launch", "No card, no queue, no “featured” paywall to be seen at all."],
              ["A dofollow backlink", "On your canonical product page. That's the point of being listed."],
              ["A minute to submit", "Five fields, all prefilled from your URL by AI."],
              ["Real votes", "Everyone who launches supports three others first. No bot upvotes."],
              ["A page that outlives the week", "Product page, comments and link stay live and indexed."],
              ["Traffic you can see", "Views, upvotes and outbound clicks in your dashboard."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3 p-5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <div>
                  <p className="text-[14px] font-semibold text-ink-900">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{body}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ── closing CTA ──────────────────────────────────── */}
      <section className="border-t border-ink-900/8 bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            The top of {weekLabel(currentWeekKey())} is still up for grabs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">
            One URL, one minute, and your product is on the board with a permanent page behind it.
          </p>
          <div className="mt-7 flex justify-center">
            <LinkButton href="/launch" size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" /> Launch for free
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
