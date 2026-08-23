"use client";

import { BODIES, requiredDollars, dollars, type Owner } from "@/lib/planets";

/**
 * The 2D fallback board. Shown when WebGL isn't available (older phones,
 * hardware acceleration off) or the 3D scene fails — so the page still works
 * and people can still claim a body. Same data, same claim flow, no canvas.
 */
export function PlanetBoard2D({
  owners,
  onSelect,
}: {
  owners: Record<string, Owner>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-[calc(100vh-3.5rem)] min-h-[560px] w-full overflow-y-auto bg-[#05060e] px-4 py-6 sm:px-6">
      <p className="mb-4 text-center text-[12px] text-white/45">
        Tap a body to claim it. (3D view isn&apos;t supported on this device — same board, same
        prices.)
      </p>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {[...BODIES]
          .sort((a, b) => {
            const ao = owners[a.id]?.amount_cents ?? -1;
            const bo = owners[b.id]?.amount_cents ?? -1;
            if (ao !== bo) return bo - ao;
            return b.minDollars - a.minDollars;
          })
          .map((b) => {
            const o = owners[b.id];
            const need = requiredDollars(b, o?.amount_cents ?? null);
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:border-ember-500/60 hover:bg-white/[0.06]"
              >
                <span
                  className="h-12 w-12 rounded-full"
                  style={{ background: b.color, boxShadow: `0 0 18px ${b.color}88` }}
                />
                <span className="text-[14px] font-semibold text-white">{b.name}</span>
                {o ? (
                  <span className="flex items-center gap-1.5 text-[12px] text-[#7dd3a0]">
                    {o.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.logo_url} alt="" className="h-3.5 w-3.5 rounded-sm" />
                    )}
                    <span className="max-w-[90px] truncate">{o.product_name}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-white/35">Unclaimed</span>
                )}
                <span className="font-mono text-[13px] font-semibold text-ember-400">
                  {o ? `${dollars(o.amount_cents)} · take $${need}` : `$${b.minDollars}`}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
