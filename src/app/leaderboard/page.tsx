import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, Rubric, Empty, LinkButton, Badge } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { ProductLogo } from "@/components/avatar";
import { AdRail } from "@/components/ad-rail";
import { currentUser } from "@/lib/supabase/server";
import { getAllTimeTop, getMyUpvotes, getWeekBoard } from "@/lib/launches";
import { currentWeekKey, shiftWeek, weekLabel, weekRangeLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — the best launches, week by week",
  description:
    "Every week's winners on Saasgrave Launches, plus the all-time top products ranked by real maker upvotes.",
};

const PAST_WEEKS = 6;

export default async function LeaderboardPage() {
  const now = currentWeekKey();
  const weeks = Array.from({ length: PAST_WEEKS }, (_, i) => shiftWeek(now, -(i + 1)));

  const [allTime, user, ...boards] = await Promise.all([
    getAllTimeTop(25),
    currentUser(),
    ...weeks.map((w) => getWeekBoard(w)),
  ]);
  const myUpvotes = await getMyUpvotes(allTime.map((p) => p.id));

  const pastWeeks = weeks
    .map((week, i) => ({ week, winners: (boards[i] as any[]).slice(0, 3) }))
    .filter((w) => w.winners.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Rubric className="mb-3">Hall of fame</Rubric>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        The leaderboard
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
        Every rank here was earned by makers clicking upvote. There is no paid placement on this
        page and there never will be — a leaderboard you can buy is just an ad.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight text-ink-900">
              <Trophy className="h-5 w-5 text-brass-500" /> All time
            </h2>
            {allTime.length === 0 ? (
              <Empty
                title="No launches yet"
                sub="The first product on this board writes the history."
                action={<LinkButton href="/launch">Launch a product</LinkButton>}
              />
            ) : (
              <Card className="overflow-hidden">
                {allTime.map((p, i) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    rank={i + 1}
                    index={i}
                    upvoted={myUpvotes.has(p.id)}
                    signedIn={Boolean(user)}
                  />
                ))}
              </Card>
            )}
          </section>

          {pastWeeks.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink-900">
                Week by week
              </h2>
              <div className="space-y-4">
                {pastWeeks.map(({ week, winners }) => (
                  <Card key={week} className="p-5">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/?w=${week}`}
                        className="text-[15px] font-semibold text-ink-900 hover:text-oxblood-600"
                      >
                        {weekLabel(week)}
                      </Link>
                      <span className="text-[12px] text-ink-400">{weekRangeLabel(week)}</span>
                    </div>
                    <ul className="space-y-2.5">
                      {winners.map((p: any, i: number) => (
                        <li key={p.id}>
                          <Link href={`/products/${p.slug}`} className="group flex items-center gap-3">
                            <span className="w-5 text-center text-sm">{["🥇", "🥈", "🥉"][i]}</span>
                            <ProductLogo src={p.logo_url} name={p.name} size={30} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-ink-900 group-hover:text-oxblood-600">
                                {p.name}
                              </span>
                              <span className="block truncate text-[12px] text-ink-400">
                                {p.tagline}
                              </span>
                            </span>
                            <Badge>{p.upvote_count} ▲</Badge>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AdRail />
          <Card className="border-dashed p-5 text-center">
            <p className="text-sm font-semibold text-ink-900">Want to be on this page?</p>
            <p className="mt-1 text-[13px] text-ink-500">
              Launch on Monday, share it once, and the week is genuinely winnable.
            </p>
            <LinkButton href="/launch" size="sm" className="mt-3 w-full">
              Launch for free
            </LinkButton>
          </Card>
        </aside>
      </div>
    </div>
  );
}
