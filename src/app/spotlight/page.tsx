import type { Metadata } from "next";
import Link from "next/link";
import { Flame, MousePointerClick } from "lucide-react";
import { Rubric } from "@/components/ui";
import { OutbidForm } from "@/components/outbid-form";
import { OrderLiveRefresh } from "@/components/order-live-refresh";
import { SpotlightTicker } from "@/components/spotlight-ticker";
import { BidCountdown } from "@/components/bid-countdown";
import { TrackOnMount } from "@/components/tracker";
import { createAdminClient } from "@/lib/supabase/server";
import { rankBids, nextTopBid, dollars, OUTBID_HOURS, type BidRow } from "@/lib/outbid";
import { cn } from "@/lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spotlight — pay to rank at the top of Saasgrave Launches",
  description:
    "Drop your SaaS link, name your bid, and the highest bid ranks #1. No ads, no login, direct pay-to-rank. Your bid stays live for 24 hours. Will you take #1?",
  alternates: { canonical: `${SITE}/spotlight` },
};

async function loadBoard(): Promise<BidRow[]> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - (OUTBID_HOURS + 1) * 60 * 60 * 1000).toISOString();
    const { data } = await admin
      .from("launch_bids")
      .select(
        "id, entry_key, display_url, url, handle, product_name, tagline, logo_url, amount_cents, status, clicks, public_token, activated_at, expires_at"
      )
      .eq("status", "active")
      .gte("activated_at", since)
      .order("amount_cents", { ascending: false })
      .limit(500);
    return rankBids((data as BidRow[]) || []);
  } catch {
    return [];
  }
}

/**
 * Real liveness — never fabricated. `online` is distinct sessions seen in the
 * last five minutes; `views24h` is spotlight page views in the last day. If
 * there's genuinely no traffic yet we return zeros and the badge stays hidden,
 * because a sad "0 online" is worse than none.
 */
async function loadStats(): Promise<{ online: number; views24h: number }> {
  try {
    const admin = createAdminClient();
    const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [live, views] = await Promise.all([
      admin
        .from("launch_events")
        .select("session_id")
        .gte("created_at", fiveMin)
        .limit(5000),
      admin
        .from("launch_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "spotlight_view")
        .gte("created_at", dayAgo),
    ]);

    const online = new Set((live.data || []).map((r: any) => r.session_id).filter(Boolean)).size;
    return { online, views24h: views.count || 0 };
  } catch {
    return { online: 0, views24h: 0 };
  }
}

export default async function SpotlightPage({ searchParams }: { searchParams: { paid?: string } }) {
  const [board, stats] = await Promise.all([loadBoard(), loadStats()]);
  const topCents = board[0]?.amount_cents ?? null;
  const claim = nextTopBid(topCents);
  const totalCents = board.reduce((s, b) => s + b.amount_cents, 0);
  const recent = [...board].sort(
    (a, b) => new Date(b.activated_at || 0).getTime() - new Date(a.activated_at || 0).getTime()
  );
  const showLive = stats.online > 0 || stats.views24h > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <TrackOnMount event="spotlight_view" />

      <div className="flex items-center justify-between">
        <Rubric>The Spotlight · pay to rank</Rubric>
        <OrderLiveRefresh />
      </div>

      {searchParams.paid && (
        <div className="mt-4 rounded-lg border border-moss-500/40 bg-moss-500/5 px-4 py-3 text-[13px] text-ink-700">
          Payment received — your bid goes live the moment we confirm it (usually seconds). Pull to
          refresh if it&apos;s not showing yet.
        </div>
      )}

      {/* ── live pill (real data only) ── */}
      {showLive && (
        <div className="mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-paper-100 px-4 py-1.5 text-[12px] text-ink-600 shadow-card">
            {stats.online > 0 && (
              <>
                <span className="h-2 w-2 animate-blink rounded-full bg-moss-500" />
                <span className="font-semibold text-ink-900">{stats.online.toLocaleString()} online</span>
              </>
            )}
            {stats.online > 0 && stats.views24h > 0 && <span className="text-ink-300">·</span>}
            {stats.views24h > 0 && (
              <span>{stats.views24h.toLocaleString()} views in 24h</span>
            )}
          </span>
        </div>
      )}

      {/* ── hero ── */}
      <h1 className="mt-4 text-center font-serif text-display font-semibold text-ink-900">
        Will you take <span className="text-ember-600">#1</span>?
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-relaxed text-ink-600">
        No ads, no API keys, no revenue share. Just outbid the competition to sit at the top of the
        board — in front of everyone who lands on Saasgrave Launches.
      </p>

      {board.length > 0 && (
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
          {board.length} live · {dollars(totalCents)} on the board · #1 is {dollars(topCents || 0)}
        </p>
      )}

      {/* ── the bid box ── */}
      <div className="mt-8 rounded-2xl border border-ink-900/15 bg-paper-100 p-6 shadow-card sm:p-8">
        <OutbidForm suggested={claim} topCents={topCents} />
      </div>

      {/* ── live ticker of latest bids ── */}
      {recent.length >= 2 && (
        <div className="mt-8">
          <SpotlightTicker bids={recent} />
        </div>
      )}

      {/* ── the board ── */}
      <div className="mt-8 space-y-2.5">
        {board.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-900/25 bg-paper-100/50 px-6 py-14 text-center">
            <p className="font-serif text-xl font-semibold text-ink-900">The board is wide open.</p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-500">
              No bids yet — the very first one takes #1 outright. Claim it above.
            </p>
          </div>
        ) : (
          board.map((b, i) => <BidRowCard key={b.id} bid={b} rank={i + 1} />)
        )}
      </div>

      {/* ── footnote ── */}
      <p className="mt-8 text-center text-[12px] leading-relaxed text-ink-400">
        Every bid stays on the board for {OUTBID_HOURS} hours, then drops off unless someone re-bids.
        Prefer to launch for free instead?{" "}
        <Link href="/launch" className="underline hover:text-ember-600">
          Launch on the weekly board →
        </Link>
      </p>
    </div>
  );
}

function BidRowCard({ bid, rank }: { bid: BidRow; rank: number }) {
  const top3 = rank <= 3;
  return (
    <a
      href={`/out/${bid.public_token}`}
      target="_blank"
      rel="noopener nofollow"
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4 transition hover:shadow-lift",
        rank === 1
          ? "border-ember-500/50 bg-ember-500/[0.05]"
          : top3
          ? "border-ember-500/25 bg-ember-500/[0.02]"
          : "border-ink-900/12 bg-paper-100"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold",
          rank === 1
            ? "bg-ember-500 text-paper-100"
            : top3
            ? "bg-ember-500/15 text-ember-600"
            : "bg-paper-200 text-ink-500"
        )}
      >
        {rank}
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bid.logo_url || ""}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-lg border border-ink-900/10 bg-paper-200 object-contain"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink-900">
          {bid.product_name || bid.display_url}
        </p>
        {bid.tagline ? (
          <p className="truncate text-[13px] leading-snug text-ink-500">{bid.tagline}</p>
        ) : (
          <p className="truncate text-[13px] text-ink-400">{bid.display_url}</p>
        )}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          <span className="inline-flex items-center gap-1">
            <MousePointerClick className="h-3 w-3" />
            {bid.clicks ?? 0} clicks
          </span>
          <BidCountdown expiresAt={bid.expires_at} />
        </p>
      </div>

      <span
        className={cn(
          "figure shrink-0 text-lg font-semibold",
          rank === 1 ? "text-ember-600" : "text-ink-900"
        )}
      >
        {dollars(bid.amount_cents)}
        {rank === 1 && <Flame className="ml-1 inline h-4 w-4" />}
      </span>
    </a>
  );
}
