"use client";

import { useEffect, useState } from "react";
import { MousePointerClick, PenLine, CreditCard, Rocket, X, HelpCircle } from "lucide-react";

const SEEN_KEY = "sg_planets_intro_v1";

const STEPS = [
  {
    icon: <MousePointerClick className="h-5 w-5" />,
    title: "1 · Click a planet",
    body: "Spin the system and tap any body — a planet, the moon, an asteroid. A panel opens on the right.",
  },
  {
    icon: <PenLine className="h-5 w-5" />,
    title: "2 · Drop your link & bid",
    body: "Paste your product URL and set your bid. Empty bodies start cheap (asteroids from $3). Bid more to make it costlier to steal.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "3 · Pay & land in space",
    body: "Pay once — no account needed. Your logo appears on that body until someone pays 1.5× to steal it.",
  },
];

/**
 * First-visit walkthrough for the planet board. People weren't sure how to buy,
 * so this spells it out in three steps and then gets out of the way. It's
 * remembered per browser, and a small "How to buy" button re-opens it any time.
 */
export function PlanetsIntro() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (!seen) setOpen(true);
    setReady(true);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — fine, it just shows again next time */
    }
  }

  if (!ready) return null;

  return (
    <>
      {/* re-open button, always available */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0c0e1acc] px-3.5 py-2 text-[12px] font-medium text-white/85 shadow-lg backdrop-blur-md transition hover:border-ember-500 hover:text-white"
        >
          <HelpCircle className="h-4 w-4 text-ember-500" /> How to buy
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#0c0e1a] p-6 text-white shadow-2xl">
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-4 text-white/50 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-400">
              <Rocket className="h-3 w-3" /> How it works
            </span>
            <h2 className="mt-3 font-serif text-2xl font-semibold">Own a planet in 3 steps</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
              Put your SaaS on a planet, in front of everyone who visits. No account, pay once.
            </p>

            <div className="mt-5 space-y-3">
              {STEPS.map((s) => (
                <div key={s.title} className="flex gap-3.5 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember-500/15 text-ember-400">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/60">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={dismiss}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ember-500 text-[15px] font-semibold text-white transition hover:bg-ember-600"
            >
              <MousePointerClick className="h-4 w-4" /> Got it — let me pick a planet
            </button>
            <button
              onClick={dismiss}
              className="mt-2 block w-full text-center text-[12px] text-white/45 transition hover:text-white/70"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </>
  );
}
