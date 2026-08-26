"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "sg_profile_nudge_v1";

export type ProfileBits = {
  avatar_url?: string | null;
  full_name?: string | null;
  maker_headline?: string | null;
  bio?: string | null;
  x_handle?: string | null;
  website_url?: string | null;
};

const CHECKS: { key: keyof ProfileBits; label: string }[] = [
  { key: "avatar_url", label: "Photo" },
  { key: "full_name", label: "Name" },
  { key: "maker_headline", label: "Headline" },
  { key: "bio", label: "Bio" },
  { key: "x_handle", label: "X handle" },
  { key: "website_url", label: "Website" },
];

/**
 * The one-time nudge a founder sees after signing in.
 *
 * A launch is read alongside the person who shipped it, so a blank profile
 * costs the maker clicks. This shows exactly what's missing and how far along
 * they are, and disappears for good once it's complete — or once dismissed.
 */
export function ProfileCompletion({ profile }: { profile: ProfileBits }) {
  const [dismissed, setDismissed] = useState(true); // assume hidden until we've read storage

  const done = CHECKS.filter((c) => String(profile[c.key] || "").trim().length > 0);
  const missing = CHECKS.filter((c) => !String(profile[c.key] || "").trim());
  const pct = Math.round((done.length / CHECKS.length) * 100);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || missing.length === 0) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — it'll show again, which is fine */
    }
  }

  function jumpToForm() {
    document.getElementById("profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const circumference = 2 * Math.PI * 26;

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-ember-500/25 bg-ember-500/[0.04] p-5">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3.5 top-3.5 text-ink-400 transition hover:text-ink-900"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-wrap items-center gap-5">
        {/* progress ring */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(22,24,29,0.10)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#f2671e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
            />
          </svg>
          <span className="absolute figure text-[13px] font-semibold text-ink-900">{pct}%</span>
        </div>

        <div className="min-w-[220px] flex-1">
          <p className="font-serif text-lg font-semibold text-ink-900">Finish your maker profile</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">
            Makers browse who shipped a product, not just the product. A complete profile gets your
            launches more clicks — it takes about a minute.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {done.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 rounded-full bg-moss-500/12 px-2.5 py-0.5 text-[11px] font-medium text-moss-600"
              >
                <Check className="h-3 w-3" /> {c.label}
              </span>
            ))}
            {missing.map((c) => (
              <span
                key={c.key}
                className={cn(
                  "rounded-full border border-dashed border-ink-900/25 px-2.5 py-0.5",
                  "text-[11px] font-medium text-ink-500"
                )}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={jumpToForm}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ember-500 px-5 text-[14px] font-semibold text-white transition hover:bg-ember-600"
        >
          Complete it <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
