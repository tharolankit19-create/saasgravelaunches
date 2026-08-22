"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { Owner } from "@/lib/planets";

// The 3D scene is heavy and browser-only — load it client-side, never on the
// server, with a dark placeholder so the layout doesn't jump.
const PlanetUniverse = dynamic(
  () => import("@/components/planet-universe").then((m) => m.PlanetUniverse),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] min-h-[560px] w-full items-center justify-center bg-[#05060e]">
        <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Entering orbit…
        </span>
      </div>
    ),
  }
);

export function PlanetUniverseLoader({ owners }: { owners: Record<string, Owner> }) {
  return <PlanetUniverse owners={owners} />;
}
