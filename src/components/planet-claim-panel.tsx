"use client";

import { useState } from "react";
import { Loader2, X, Globe } from "lucide-react";
import { requiredDollars, dollars, type Body, type Owner } from "@/lib/planets";
import { trackEvent } from "@/lib/track-client";

/**
 * The claim form for one body. Pure DOM (no 3D), so it works identically in the
 * 3D scene and the 2D fallback. Pick an amount, drop a URL, pay.
 */
export function ClaimPanel({
  body,
  owner,
  onClose,
}: {
  body: Body;
  owner?: Owner;
  onClose: () => void;
}) {
  const need = requiredDollars(body, owner?.amount_cents ?? null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(need);
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = amount >= 500 ? 50 : amount >= 100 ? 10 : amount >= 20 ? 5 : 1;

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return setError("Add your product URL.");
    if (amount < need) return setError(`${body.name} needs at least $${need}.`);

    setBusy(true);
    trackEvent("planet_claim_start", { meta: { planet: body.id, amount } });
    try {
      const res = await fetch("/api/planet-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planetId: body.id, url, productName: name, amount, tagline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-2xl border border-white/12 bg-[#0c0e1af2] p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[360px]">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 text-white/50 transition hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full"
          style={{ background: body.color, boxShadow: `0 0 14px ${body.color}` }}
        />
        <h2 className="font-serif text-xl font-semibold">{body.name}</h2>
        <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-white/60">
          {body.kind}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{body.blurb}</p>

      {owner ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#7dd3a0]/25 bg-[#7dd3a0]/10 px-3 py-2 text-[12px]">
          {owner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.logo_url} alt="" className="h-4 w-4 rounded-sm" />
          )}
          <span className="text-white/80">
            Held by <span className="font-semibold text-white">{owner.product_name}</span> for{" "}
            {dollars(owner.amount_cents)}
          </span>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
          Unclaimed · floor <span className="font-semibold text-white">${body.minDollars}</span>
        </p>
      )}

      <form onSubmit={claim} className="mt-4 space-y-3">
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourproduct.com"
            className="h-11 w-full rounded-lg border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ember-500/70"
          />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Product name (optional)"
          className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ember-500/70"
        />

        <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2">
          <span className="text-[12px] text-white/60">Your bid</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAmount((a) => Math.max(need, a - step))}
              className="h-7 w-7 rounded-full border border-white/20 text-white/80 transition hover:border-ember-500"
            >
              –
            </button>
            <span className="min-w-[4ch] text-center text-lg font-bold tabular-nums">${amount}</span>
            <button
              type="button"
              onClick={() => setAmount((a) => a + step)}
              className="h-7 w-7 rounded-full border border-white/20 text-white/80 transition hover:border-ember-500"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-white/45">
          {owner
            ? `Seize ${body.name} for $${need} — that's 1.5× the current ${dollars(owner.amount_cents)}.`
            : `Floor is $${body.minDollars}. Bid more to make it costlier to steal.`}
        </p>

        {error && <p className="text-center text-[12px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ember-500 text-[15px] font-semibold text-white transition hover:bg-ember-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {owner ? "Seize" : "Claim"} {body.name} · ${amount}
        </button>
        <p className="text-center text-[10px] text-white/40">
          Pay once. Your logo lands on {body.name} until someone outbids you. No account needed.
        </p>
      </form>
    </div>
  );
}
