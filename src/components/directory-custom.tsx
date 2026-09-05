"use client";

import { useState } from "react";
import { Sliders, Copy, Check, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

/**
 * The custom directory plan. Anything from 10 to 200 directories, with a live
 * price estimate on the same slope as the three fixed tiers ($99/40, $149/80,
 * $199/120 → ~$1.25/directory + a $49 base). Custom orders are hand-scoped, so
 * the CTA is "DM the founder on X" — it copies the order summary and opens the
 * DM so there's zero back-and-forth.
 */
const MIN = 10;
const MAX = 200;
const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE || "saasgrave").replace(/^@/, "");

function priceFor(dirs: number): number {
  // Round to the nearest $5, same slope as the fixed tiers.
  return Math.round((49 + dirs * 1.25) / 5) * 5;
}

export function DirectoryCustom() {
  const [dirs, setDirs] = useState(60);
  const [copied, setCopied] = useState(false);
  const price = priceFor(dirs);

  const summary = `Hi — I'd like a custom directory submission: ${dirs} directories (est. ~$${price}). My product: `;

  async function copyAndDM() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Order copied — paste it in the DM and add your URL.");
    } catch {
      /* clipboard blocked — the DM still opens */
    }
    window.open(`https://x.com/${X_HANDLE}`, "_blank", "noopener");
  }

  return (
    <div className="rounded-2xl border border-ink-900/20 bg-paper-100 p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-ember-500" />
          <h3 className="font-serif text-xl font-semibold text-ink-900">Custom list</h3>
          <span className="rounded-full border border-ink-900/12 bg-paper-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">
            10 – 200 directories
          </span>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-[12px] text-ink-400">est.</span>
          <span className="figure text-3xl font-semibold text-ink-900">~${price}</span>
        </p>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-ink-500">
        Pick exactly how many high-DR directories you want. Same hand-done service, do-follow only,
        full report — scoped to you. Custom orders are arranged directly with the founder.
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
          <span>{MIN}</span>
          <span className="text-ink-900">
            <strong className="figure text-[15px]">{dirs}</strong> directories
          </span>
          <span>{MAX}</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={5}
          value={dirs}
          onChange={(e) => setDirs(Number(e.target.value))}
          className="mt-2 w-full accent-ember-500"
          aria-label="Number of directories"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyAndDM}
          className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-[14px] font-medium text-paper-100 transition hover:bg-ember-500"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy order &amp; DM on X
          <ArrowUpRight className="h-4 w-4" />
        </button>
        <span className="text-[12px] text-ink-400">
          Opens a DM to @{X_HANDLE} with your order ready to paste.
        </span>
      </div>
    </div>
  );
}
