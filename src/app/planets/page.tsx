import type { Metadata } from "next";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { PlanetUniverseLoader } from "@/components/planet-universe-loader";
import { TrackOnMount } from "@/components/tracker";
import { createAdminClient } from "@/lib/supabase/server";
import { BODIES, ownersByPlanet, dollars, type Owner } from "@/lib/planets";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conquer the Solar System — buy a planet for your SaaS",
  description:
    "A 3D solar system where every planet is a slot your SaaS can own. Bigger the body, higher the price. Claim a planet, put your logo in space, and hold it until someone outbids you.",
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

export default async function PlanetsPage({ searchParams }: { searchParams: { claimed?: string } }) {
  const owners = await loadOwners();
  const owned = BODIES.filter((b) => owners[b.id]).length;

  return (
    <div>
      <TrackOnMount event="planets_view" />

      {searchParams.claimed && (
        <div className="border-b border-moss-500/30 bg-moss-500/10 px-4 py-2.5 text-center text-[13px] text-ink-700">
          Payment received — your logo lands on the map the moment we confirm it (usually seconds).
        </div>
      )}

      {/* ── the universe ── */}
      <PlanetUniverseLoader owners={owners} />

      {/* ── below the fold: what this is + the territory ── */}
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-600">
            <Rocket className="h-3 w-3" /> Pay to own · no account
          </span>
          <h1 className="mt-4 font-serif text-display font-semibold text-ink-900">
            Conquer the solar system
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-700">
            Every body up there is a slot your SaaS can own. The bigger the planet, the more it
            costs — the Sun is the crown, asteroids are pocket change. Claim one, plant your logo in
            space, and hold it until someone pays more to take it.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
            {owned} of {BODIES.length} bodies claimed
          </p>
        </div>

        {/* territory table */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-ink-900/12">
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
                  className="flex items-center gap-3 border-b border-ink-900/8 bg-paper-100 px-4 py-3 last:border-0"
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ background: b.color }}
                  />
                  <span className="w-28 shrink-0 text-[14px] font-semibold text-ink-900">
                    {b.name}
                  </span>
                  {o ? (
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-ink-600 hover:text-ember-600"
                    >
                      {o.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.logo_url} alt="" className="h-4 w-4 rounded-sm" />
                      )}
                      <span className="truncate">{o.product_name}</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-[13px] text-ink-400">Unclaimed</span>
                  )}
                  <span className="shrink-0 font-mono text-[13px] font-semibold text-ink-900">
                    {o ? dollars(o.amount_cents) : `$${b.minDollars}`}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Saasgrave promo */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-ink-900/12 bg-paper-100 p-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[14px] font-semibold text-ink-900">Just want to launch, not conquer?</p>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Launch your SaaS free on Saasgrave Launches — a real weekly board, real votes, a
              dofollow backlink you keep.
            </p>
          </div>
          <Link
            href="/launch"
            className="shrink-0 rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500"
          >
            Launch free →
          </Link>
        </div>
      </div>
    </div>
  );
}
