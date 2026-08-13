import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, MessageSquare, BadgeCheck, Sparkles } from "lucide-react";
import { Card, Rubric, Empty, LinkButton } from "@/components/ui";
import { ProductLogo } from "@/components/avatar";
import { UpvoteButton } from "@/components/upvote-button";
import { AdRail } from "@/components/ad-rail";
import { currentUser } from "@/lib/supabase/server";
import { getLeaderboard, getMyUpvotes, isLeaderRange, type LaunchProduct, type LeaderRange } from "@/lib/launches";
import { categorySlug } from "@/lib/categories";
import { currentWeekKey, weekLabel } from "@/lib/week";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — the best launches, this week and all time",
  description:
    "The top products on Saasgrave Launches, ranked by real maker upvotes. Switch between this week, this month and all time. No paid placement, ever.",
};

const RANGES: { key: LeaderRange; label: string; blurb: string }[] = [
  { key: "week", label: "This week", blurb: `The race on this week's board — ${weekLabel(currentWeekKey())}.` },
  { key: "month", label: "This month", blurb: "Everything launched in the last 31 days, best first." },
  { key: "all", label: "All time", blurb: "Every launch that ever ran here, ranked by upvotes." },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range: LeaderRange = isLeaderRange(searchParams.range) ? searchParams.range : "all";
  const meta = RANGES.find((r) => r.key === range)!;

  const [products, user] = await Promise.all([getLeaderboard(range, 50), currentUser()]);
  const myUpvotes = await getMyUpvotes(products.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Rubric className="mb-3">Hall of fame</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">The leaderboard</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
        Every rank here was earned by makers clicking upvote. There is no paid placement on this
        page and there never will be — a leaderboard you can buy is just an ad.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {/* range switcher — the weekly / monthly / all-time control */}
          <div className="mb-5 inline-flex rounded-lg border border-ink-900/12 bg-paper-100 p-1">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={r.key === "all" ? "/leaderboard" : `/leaderboard?range=${r.key}`}
                className={cn(
                  "rounded-[6px] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition",
                  r.key === range
                    ? "bg-ink-900 text-paper-100 shadow-card"
                    : "text-ink-500 hover:text-ink-900"
                )}
              >
                {r.label}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <Empty
              title={range === "week" ? "Nothing on the board yet this week" : "No launches yet"}
              sub={
                range === "week"
                  ? "The number-one spot is genuinely unclaimed. Launch and take it."
                  : "The first product on this board writes the history."
              }
              action={<LinkButton href="/launch">Launch a product</LinkButton>}
            />
          ) : (
            <Card className="overflow-hidden shadow-lift">
              {/* one cohesive box: a header, then the ranked entries */}
              <div className="flex items-center gap-2 border-b border-ink-900/10 bg-gradient-to-r from-brass-500/[0.06] to-transparent px-5 py-4">
                <Trophy className="h-4 w-4 text-brass-500" />
                <span className="font-serif text-[15px] font-semibold text-ink-900">
                  {meta.label}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  {products.length} ranked
                </span>
              </div>

              {products.map((p, i) => (
                <LeaderRow
                  key={p.id}
                  product={p}
                  rank={i + 1}
                  upvoted={myUpvotes.has(p.id)}
                  signedIn={Boolean(user)}
                  index={i}
                />
              ))}
            </Card>
          )}

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
            {meta.blurb} Ranked by upvotes, then who launched first.
          </p>
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

/**
 * One entry in the leaderboard. Richer than a board row: a medal disc for the
 * podium instead of a coloured edge-strip, a bigger logo, and the full vote
 * control on the right so the count reads as the headline it is.
 */
function LeaderRow({
  product,
  rank,
  upvoted,
  signedIn,
  index,
}: {
  product: LaunchProduct;
  rank: number;
  upvoted: boolean;
  signedIn: boolean;
  index: number;
}) {
  return (
    <div
      className="row-in relative flex items-center gap-4 border-b border-ink-900/8 px-4 py-4 transition-colors last:border-b-0 hover:bg-paper-200/50 sm:px-5"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <RankMedal rank={rank} />

      <ProductLogo src={product.logo_url} name={product.name} size={52} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/products/${product.slug}`}
            className="font-serif text-[17px] font-semibold leading-tight tracking-tight text-ink-900 hover:text-ember-600"
          >
            {product.name}
            <span className="absolute inset-0 z-0" aria-hidden />
          </Link>
          {product.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-brass-500" aria-label="Premium maker" />
          )}
          {product.featured && (
            <Sparkles className="h-3.5 w-3.5 text-ember-500" aria-label="Editor's pick" />
          )}
        </div>

        <p className="mt-0.5 truncate text-[14px] leading-snug text-ink-500">{product.tagline}</p>

        <div className="relative z-10 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {product.comment_count}
          </span>
          {(product.categories || []).slice(0, 2).map((c) => (
            <Link key={c} href={`/categories/${categorySlug(c)}`} className="hover:text-ember-600">
              {c}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <UpvoteButton
          productId={product.id}
          slug={product.slug}
          count={product.upvote_count}
          upvoted={upvoted}
          signedIn={signedIn}
          size="lg"
        />
      </div>
    </div>
  );
}

/** A medal disc for the podium, a plain typeset numeral for everyone else. */
function RankMedal({ rank }: { rank: number }) {
  if (rank <= 3) {
    const tone = {
      1: "from-brass-400 to-brass-600 text-paper-50 ring-brass-500/30",
      2: "from-paper-300 to-paper-400 text-ink-700 ring-ink-900/15",
      3: "from-ember-400 to-ember-600 text-paper-50 ring-ember-500/30",
    }[rank as 1 | 2 | 3];
    return (
      <span
        className={cn(
          "figure grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[15px] font-bold shadow-card ring-2",
          tone
        )}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="figure w-9 shrink-0 text-center text-[15px] font-semibold text-ink-400">
      {rank}
    </span>
  );
}
