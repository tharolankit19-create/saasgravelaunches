"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { OUTBID_MIN_DOLLARS } from "@/lib/outbid";
import { trackEvent } from "@/lib/track-client";

/**
 * The whole engine, in one box: a link, an amount, a button. The amount is the
 * game — the stepper and the big number make raising your bid a one-tap
 * reflex, which is the entire point of a bidding war.
 */
export function OutbidForm({ suggested }: { suggested: number }) {
  const [entry, setEntry] = useState("");
  const [amount, setAmount] = useState(Math.max(OUTBID_MIN_DOLLARS, suggested));
  const [tagline, setTagline] = useState("");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = amount >= 500 ? 50 : amount >= 100 ? 10 : 5;
  const bump = (d: number) => setAmount((a) => Math.max(OUTBID_MIN_DOLLARS, a + d));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!entry.trim()) return setError("Add your product URL or @handle.");
    if (amount < OUTBID_MIN_DOLLARS) return setError(`Minimum bid is $${OUTBID_MIN_DOLLARS}.`);

    setBusy(true);
    trackEvent("outbid_start", { meta: { amount } });
    try {
      const res = await fetch("/api/outbid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry, amount, tagline, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      // Straight to Dodo. On success Dodo returns them to the board.
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl">
      {/* the big claim number */}
      <div className="flex flex-col items-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
          Your bid decides your rank
        </p>
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => bump(-step)}
            aria-label="Lower bid"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-900/20 text-ink-700 transition hover:border-ember-500 hover:text-ember-600"
          >
            <Minus className="h-5 w-5" />
          </button>

          <div className="min-w-[9ch] text-center">
            <span className="figure text-6xl font-semibold tracking-tight text-ink-900">
              ${amount.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => bump(step)}
            aria-label="Raise bid"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-900/20 text-ink-700 transition hover:border-ember-500 hover:text-ember-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink-400">
          Pay less than #1 and you still land on the board — at whatever place your bid takes.
        </p>
      </div>

      {/* the entry + go */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Your product URL or @handle"
            className="h-14 w-full rounded-full border border-ink-900/18 bg-paper-100 pl-11 pr-4 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ember-500/60 focus:ring-2 focus:ring-ember-500/12"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 text-[15px] font-semibold text-paper-100 transition hover:bg-ember-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Outbid · ${amount.toLocaleString()}
        </button>
      </div>

      {/* optional extras, tucked away */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600"
        >
          {open ? "– hide details" : "+ add a tagline (optional)"}
        </button>
      </div>
      {open && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={160}
            placeholder="One line about your product"
            className={cn(
              "h-11 rounded-lg border border-ink-900/18 bg-paper-100 px-3.5 text-sm text-ink-900 outline-none",
              "placeholder:text-ink-400 focus:border-ember-500/60"
            )}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            maxLength={200}
            placeholder="Email for your receipt (optional)"
            className={cn(
              "h-11 rounded-lg border border-ink-900/18 bg-paper-100 px-3.5 text-sm text-ink-900 outline-none",
              "placeholder:text-ink-400 focus:border-ember-500/60"
            )}
          />
        </div>
      )}

      {error && (
        <p className="mt-3 text-center text-[13px] text-red-600">{error}</p>
      )}
      <p className="mt-3 text-center text-[11px] text-ink-400">
        Already listed? Enter the same URL and bid higher to climb back up. No account needed · your
        bid stays live for 24 hours.
      </p>
    </form>
  );
}
