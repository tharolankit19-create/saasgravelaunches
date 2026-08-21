import type { Metadata } from "next";
import Link from "next/link";
import { Flame, MousePointerClick } from "lucide-react";
import { OutbidForm } from "@/components/outbid-form";
import { OrderLiveRefresh } from "@/components/order-live-refresh";
import { SpotlightTicker } from "@/components/spotlight-ticker";
import { TrackOnMount } from "@/components/tracker";
import { createAdminClient } from "@/lib/supabase/server";
import { rankBids, nextTopBid, dollars, type BidRow } from "@/lib/outbid";
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
    const { data } = await admin
      .from("launch_bids")
      .select(
        "id, entry_key, display_url, url, handle, product_name, tagline, logo_url, amount_cents, status, clicks, public_token, activated_at, expires_at"
      )
      .eq("status", "active")
      .order("amount_cents", { ascending: false })
      .limit(500);
    return rankBids((data as BidRow[]) || []);
  } catch {
    return [];
  }
}

function ago(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// A tiny stable PRNG so a seeded base doesn't flicker on every render.
function seeded(seed: string, min: number, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const r = (h >>> 0) / 2 ** 32;
  return min + Math.floor(r * (max - min + 1));
}

/**
 * The Spotlight counters.
 *
 * Displayed = a seeded base + a multiple of real traffic:
 *   live 24h total = base(500–600) + 7 × real visitors in the last 24h
 *   live online    = base(40–50)  + 3 × real sessions in the last 5 min
 * The 24h base is seeded per calendar day and the online base per few-minute
 * window, so the numbers hold steady between refreshes and drift naturally
 * over time rather than jumping around.
 */
async function loadStats(): Promise<{ online: number; visitors: number }> {
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);
  const liveKey = `${dayKey}-${now.getUTCHours()}-${Math.floor(now.getUTCMinutes() / 3)}`;
  const base24h = seeded(dayKey, 500, 600);
  const baseLive = seeded(liveKey, 40, 50);

  try {
    const admin = createAdminClient();
    const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [live, views] = await Promise.all([
      admin.from("launch_events").select("session_id").gte("created_at", fiveMin).limit(5000),
      admin
        .from("launch_events")
        .select("id", { count: "exact", head: true })
        .eq("event", "spotlight_view")
        .gte("created_at", dayAgo),
    ]);

    const realOnline = new Set(
      (live.data || []).map((r: any) => r.session_id).filter(Boolean)
    ).size;
    const realViews24h = views.count || 0;

    return {
      online: baseLive + realOnline * 3,
      visitors: base24h + realViews24h * 7,
    };
  } catch {
    return { online: baseLive, visitors: base24h };
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
  const showLive = stats.online > 0 || stats.visitors > 0; // bases keep this true

  return (
    <div className="min-h-screen bg-paper-50">
      <TrackOnMount event="spotlight_view" />

      {/* ── its own minimal top bar — no Saasgrave masthead here ── */}
      <div className="h-[3px] w-full bg-ember-500" />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/spotlight" className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-ember-500" />
          <span className="font-serif text-lg font-semibold tracking-tight text-ink-900">
            Spotlight
          </span>
        </Link>
        <Link
          href="/launch"
          className="rounded-full border border-ink-900/15 px-3.5 py-1.5 text-[12px] font-medium text-ink-700 transition hover:border-ember-500 hover:text-ember-600"
        >
          Launch your SaaS free →
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex items-center justify-end">
          <OrderLiveRefresh />
        </div>

        {searchParams.paid && (
          <div className="mt-2 rounded-lg border border-moss-500/40 bg-moss-500/5 px-4 py-3 text-[13px] text-ink-700">
            Payment received — your bid goes live the moment we confirm it (usually seconds). Pull to
            refresh if it&apos;s not showing yet.
          </div>
        )}

        {/* ── live counter — big and prominent ── */}
        {showLive && (
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-4 rounded-full border border-ink-900/12 bg-paper-100 px-6 py-3 shadow-lift">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-500/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-moss-500" />
                </span>
                <span className="text-[16px] leading-none">
                  <span className="font-bold text-ink-900">{stats.online.toLocaleString()}</span>{" "}
                  <span className="text-ink-500">online</span>
                </span>
              </span>
              <span className="h-5 w-px bg-ink-900/15" />
              <span className="text-[16px] leading-none">
                <span className="font-bold text-ink-900">{stats.visitors.toLocaleString()}</span>{" "}
                <span className="text-ink-500">in the last 24h</span>
              </span>
            </div>
          </div>
        )}

        {/* ── hero ── */}
        <h1 className="mt-4 text-center font-serif text-display font-semibold text-ink-900">
          Will you take <span className="text-ember-600">#1</span>?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-relaxed text-ink-600">
          No ads, no API keys, no revenue share. Just outbid the competition to sit at the top of the
          board — in front of everyone who lands here.
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

        {/* ── Saasgrave promo — the one place it shows through ── */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-ink-900/12 bg-paper-100 p-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[14px] font-semibold text-ink-900">Don&apos;t want to pay to rank?</p>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Launch your SaaS free on Saasgrave Launches — a real board, real votes, a dofollow
              backlink you keep.
            </p>
          </div>
          <Link
            href="/launch"
            className="shrink-0 rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500"
          >
            Launch free →
          </Link>
        </div>

        {/* ── footnote ── */}
        <p className="mt-8 text-center text-[12px] leading-relaxed text-ink-400">
          Your bid stays on the board — the only way up is to bid higher. Part of{" "}
          <Link href="/" className="underline hover:text-ember-600">
            Saasgrave Launches
          </Link>
          .
        </p>
      </div>
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
          {bid.activated_at && <span>{ago(bid.activated_at)}</span>}
          <span className="inline-flex items-center gap-1">
            <MousePointerClick className="h-3 w-3" />
            {bid.clicks ?? 0} clicks
          </span>
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
