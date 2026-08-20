"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An interactive pre-launch checklist. Free, saved in localStorage, and a solid
 * SEO page ("saas launch checklist"). Items link back into the product where it
 * makes sense — a gentle funnel that's genuinely useful.
 */
const STORE = "sg_launch_checklist_v1";

const SECTIONS: { title: string; items: { t: string; href?: string }[] }[] = [
  {
    title: "Before you launch",
    items: [
      { t: "Landing page loads fast and states what it does in one line" },
      { t: "A real screenshot or a 30-second demo video" },
      { t: "Pricing is visible (even if it's just 'free')" },
      { t: "OG image set — it's your link's thumbnail everywhere" },
      { t: "Analytics installed (Plausible / GA / PostHog)" },
    ],
  },
  {
    title: "Launch day",
    items: [
      { t: "Launch on Saasgrave Launches — AI writes your listing", href: "/launch" },
      { t: "Post on X and LinkedIn from your personal profile" },
      { t: "Tell 5 people who'd genuinely use it — ask for honest feedback" },
      { t: "Reply to every comment in the first few hours" },
      { t: "Add the 'Featured on' badge to your site" },
    ],
  },
  {
    title: "The week after",
    items: [
      { t: "Submit to high-DR directories for backlinks", href: "/free-directories" },
      { t: "Or have them submitted for you by hand", href: "/directories" },
      { t: "Write one post-launch post: what worked, what didn't" },
      { t: "Email the people who signed up — don't let them go cold" },
      { t: "Pick the one metric that matters and watch only that" },
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.items.map((i) => i.t));

export function LaunchChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(t: string) {
    const next = { ...done, [t]: !done[t] };
    setDone(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const count = ALL.filter((t) => done[t]).length;
  const pct = Math.round((count / ALL.length) * 100);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-ink-900/20 bg-paper-100 p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <p className="text-[14px] font-semibold text-ink-900">
            <span className="figure text-ember-600">{count}</span> of {ALL.length} done
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">{pct}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-300">
          <div className="h-full rounded-full bg-ember-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="mb-3 font-serif text-lg font-semibold text-ink-900">{s.title}</h2>
            <ul className="overflow-hidden rounded-xl border border-ink-900/20 bg-paper-100 shadow-card">
              {s.items.map((it) => {
                const on = done[it.t];
                return (
                  <li key={it.t} className="border-b border-ink-900/8 last:border-b-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(it.t)}
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition",
                          on
                            ? "border-moss-500/50 bg-moss-500/15 text-moss-600"
                            : "border-ink-900/20 text-transparent hover:border-moss-500/40"
                        )}
                        aria-pressed={on}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-[14px] text-ink-700",
                          on && "text-ink-400 line-through"
                        )}
                      >
                        {it.t}
                      </span>
                      {it.href && (
                        <Link
                          href={it.href}
                          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ember-600 hover:underline"
                        >
                          Do it →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
