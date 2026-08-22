import type { Metadata } from "next";
import Link from "next/link";
import { Sun, MousePointerClick, CreditCard, Rocket } from "lucide-react";
import { PlanetUniverseLoader } from "@/components/planet-universe-loader";
import { TrackOnMount } from "@/components/tracker";
import { createAdminClient } from "@/lib/supabase/server";
import { BODIES, ownersByPlanet, dollars, type Owner } from "@/lib/planets";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conquer the Solar System — buy a planet for your SaaS",
  description:
    "A 3D solar system where every planet is a slot your SaaS can own. Bigger the body, higher the price. Claim a planet, put your logo in space, and hold it until someone outbids you. No account.",
  alternates: { canonical: `${SITE}/planets` },
};

async function loadOwners(): Promise<Record<string, Owner>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("launch_planet_claims")
      .select("planet_id, product_name, url, logo_url, tagline, amount_cents, public_token")
      .eq("status", "active")
      .order("amount_cents", { ascending: false })
      .limit(500);
    return ownersByPlanet((data as Owner[]) || []);
  } catch {
    return {};
  }
}

const STEPS = [
  { icon: <MousePointerClick className="h-4 w-4" />, title: "Pick a body", body: "Spin the system and click any planet, moon or rock." },
  { icon: <CreditCard className="h-4 w-4" />, title: "Name your bid & pay", body: "Cheap to grab an empty body. To steal a held one, pay 1.5× its price." },
  { icon: <Sun className="h-4 w-4" />, title: "Own it in space", body: "Your logo lands on the body — until someone pays more." },
];

export default async function PlanetsPage({ searchParams }: { searchParams: { claimed?: string } }) {
  const owners = await loadOwners();
  const owned = BODIES.filter((b) => owners[b.id]).length;

  return (
    <div className="min-h-screen bg-[#05060e] text-white">
      <TrackOnMount event="planets_view" />

      {/* ── its own minimal top bar ── */}
      <div className="h-[3px] w-full bg-ember-500" />
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/planets" className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-ember-500" />
          <span className="font-serif text-lg font-semibold tracking-tight">Solar System</span>
        </Link>
        <Link
          href="/launch"
          className="rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-medium text-white/80 transition hover:border-ember-500 hover:text-white"
        >
          Launch your SaaS free →
        </Link>
      </header>

      {searchParams.claimed && (
        <div className="border-y border-moss-500/30 bg-moss-500/10 px-4 py-2.5 text-center text-[13px] text-moss-200">
          Payment received — your logo lands on the map the moment we confirm it (usually seconds).
        </div>
      )}

      {/* ── the universe ── */}
      <PlanetUniverseLoader owners={owners} />

      {/* ── below the fold ── */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-400">
            <Rocket className="h-3 w-3" /> Pay to own · no account
          </span>
          <h1 className="mt-4 font-serif text-display font-semibold">Conquer the solar system</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
            Every body up there is a slot your SaaS can own. The bigger the planet, the more it
            costs — the Sun is the crown, asteroids are pocket change. Claim one, plant your logo in
            space, and hold it until someone pays more to take it.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
            {owned} of {BODIES.length} bodies claimed
          </p>
        </div>

        {/* how it works */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/15 text-ember-400">
                {s.icon}
              </span>
              <p className="mt-3 font-serif text-lg font-semibold">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">{s.body}</p>
            </div>
          ))}
        </div>

        {/* territory / leaderboard */}
        <h2 className="mt-14 mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          The map · every body & its price
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {[...BODIES]
            .sort((a, b) => {
              const ao = owners[a.id]?.amount_cents ?? -1;
              const bo = owners[b.id]?.amount_cents ?? -1;
              if (ao !== bo) return bo - ao;
              return b.minDollars - a.minDollars;
            })
            .map((b) => {
              const o = owners[b.id];
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 border-b border-white/8 bg-white/[0.02] px-4 py-3 last:border-0"
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ background: b.color, boxShadow: `0 0 8px ${b.color}66` }}
                  />
                  <span className="w-28 shrink-0 text-[14px] font-semibold">{b.name}</span>
                  {o ? (
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-white/70 hover:text-ember-400"
                    >
                      {o.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.logo_url} alt="" className="h-4 w-4 rounded-sm" />
                      )}
                      <span className="truncate">{o.product_name}</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-[13px] text-white/35">Unclaimed</span>
                  )}
                  <span className="shrink-0 font-mono text-[13px] font-semibold text-ember-400">
                    {o ? dollars(o.amount_cents) : `$${b.minDollars}`}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Saasgrave promo */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[14px] font-semibold">Just want to launch, not conquer?</p>
            <p className="mt-0.5 text-[13px] text-white/55">
              Launch your SaaS free on Saasgrave Launches — a real weekly board, real votes, a
              dofollow backlink you keep.
            </p>
          </div>
          <Link
            href="/launch"
            className="shrink-0 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-[#05060e] transition hover:bg-ember-500 hover:text-white"
          >
            Launch free →
          </Link>
        </div>

        <p className="mt-10 text-center text-[12px] text-white/35">
          Part of{" "}
          <Link href="/" className="underline hover:text-ember-400">
            Saasgrave Launches
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
