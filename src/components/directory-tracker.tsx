"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, SkipForward, ExternalLink, Search, X, Clock, Star } from "lucide-react";
import { faviconFor, type Directory } from "@/lib/directories";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

type Status = "done" | "skip";
type Filter = "all" | "dofollow" | "free" | "dr85" | "dr70";

const STORE_KEY = "sg_dir_tracker_v1";

/**
 * The free directory tracker — a self-serve SEO tool AND the top of the paid
 * funnel. Every directory is a row with Done / Skip / Visit. Progress lives in
 * localStorage (no account needed), and every "Visit" nudges the paid
 * done-for-you service, because doing 120 of these by hand is the pain we sell.
 * The list is passed in from the server, so it's fully in the SSR HTML.
 */
export function DirectoryTracker({ directories }: { directories: Directory[] }) {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [upsell, setUpsell] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  // Load saved progress after mount (avoids any hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setStatus(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function save(next: Record<string, Status>) {
    setStatus(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function setOne(url: string, s: Status) {
    const next = { ...status };
    if (next[url] === s) delete next[url];
    else next[url] = s;
    save(next);
  }

  function onVisit(d: Directory) {
    window.open(d.url, "_blank", "noopener");
    trackEvent("directory_visit", { meta: { name: d.name } });
    const c = visitCount + 1;
    setVisitCount(c);
    // Nudge the paid service on the first visit, then occasionally — never on
    // every single click, so it stays a nudge and not a wall.
    if (c === 1 || c % 4 === 0) setUpsell(true);
  }

  const doneCount = Object.values(status).filter((s) => s === "done").length;
  const total = directories.filter((d) => !d.featured).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directories.filter((d) => {
      if (q && !`${d.name} ${d.category} ${d.type} ${d.bestFor}`.toLowerCase().includes(q))
        return false;
      if (filter === "dofollow" && !d.dofollow) return false;
      if (filter === "free" && !d.free) return false;
      if (filter === "dr85" && d.dr < 85) return false;
      if (filter === "dr70" && d.dr < 70) return false;
      return true;
    });
  }, [directories, query, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "dofollow", label: "Do-follow" },
    { key: "free", label: "Free" },
    { key: "dr70", label: "DR 70+" },
    { key: "dr85", label: "DR 85+" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        {/* progress */}
        <div className="rounded-xl border border-ink-900/20 bg-paper-100 p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] font-semibold text-ink-900">
              You&apos;ve done <span className="figure text-ember-600">{doneCount}</span> of {total}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
              {pct}% complete
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-300">
            <div
              className="h-full rounded-full bg-ember-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-500">
            Doing all of these by hand takes ~70 hours.{" "}
            <Link href="/directories" className="font-medium text-ember-600 hover:underline">
              We&apos;ll do it for you →
            </Link>
          </p>
        </div>

        {/* controls */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 120 directories…"
              className="w-full rounded-lg border border-ink-900/20 bg-paper-100 py-2.5 pl-10 pr-3 text-sm text-ink-900 outline-none focus:border-ember-500/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition",
                  filter === f.key
                    ? "border-ink-900 bg-ink-900 text-paper-100"
                    : "border-ink-900/15 bg-paper-100 text-ink-500 hover:border-ember-500/40 hover:text-ember-600"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* list */}
        <div className="mt-5 overflow-hidden rounded-xl border border-ink-900/20 bg-paper-100 shadow-card">
          {filtered.map((d, i) => {
            const s = status[d.url];
            return (
              <div
                key={d.url + i}
                className={cn(
                  "flex items-center gap-3 border-b border-ink-900/8 px-3 py-3 transition-colors last:border-b-0 sm:px-4",
                  d.featured && "bg-ember-500/[0.05]",
                  s === "done" && "bg-moss-500/[0.06]",
                  s === "skip" && "opacity-55"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faviconFor(d.url)}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  className="h-7 w-7 shrink-0 rounded-md border border-ink-900/10 bg-white object-contain"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener"
                      className={cn(
                        "truncate text-[14px] font-semibold text-ink-900 hover:text-ember-600",
                        s === "done" && "line-through decoration-ink-900/30"
                      )}
                    >
                      {d.name}
                    </a>
                    {d.featured && (
                      <span className="inline-flex items-center gap-1 rounded-[3px] bg-ember-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-paper-50">
                        <Star className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                    {!d.featured && <DrBadge dr={d.dr} />}
                    {d.dofollow && (
                      <span className="rounded-[3px] bg-moss-500/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-moss-600">
                        Dofollow
                      </span>
                    )}
                    {d.free && (
                      <span className="rounded-[3px] border border-ink-900/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-500">
                        Free
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-ink-400">{d.bestFor}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {d.featured ? (
                    <Link
                      href="/launch"
                      className="rounded-lg bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-paper-100 transition hover:bg-ember-500"
                    >
                      Launch
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        title="Mark done"
                        onClick={() => setOne(d.url, "done")}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border transition",
                          s === "done"
                            ? "border-moss-500/50 bg-moss-500/15 text-moss-600"
                            : "border-ink-900/15 text-ink-400 hover:border-moss-500/40 hover:text-moss-600"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Skip"
                        onClick={() => setOne(d.url, "skip")}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg border transition",
                          s === "skip"
                            ? "border-ink-900/30 bg-paper-300 text-ink-700"
                            : "border-ink-900/15 text-ink-400 hover:border-ink-900/30 hover:text-ink-700"
                        )}
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Visit & submit"
                        onClick={() => onVisit(d)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink-900/15 px-2.5 text-[12px] font-medium text-ink-700 transition hover:border-ember-500/50 hover:text-ember-600"
                      >
                        Visit <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] text-ink-400">
              Nothing matches. Try another filter.
            </p>
          )}
        </div>
      </div>

      {/* side CTA — always visible so they notice the shortcut */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-ember-500/40 bg-ember-500/[0.04] p-6 shadow-lift">
          <Clock className="h-5 w-5 text-ember-600" />
          <h3 className="mt-3 font-serif text-lg font-semibold text-ink-900">
            Don&apos;t have 70 hours?
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
            We submit your product to these high-DR directories by hand. Do-follow only, full report,
            we start within 48 hours.
          </p>
          <ul className="mt-4 space-y-1.5 text-[13px] text-ink-700">
            <li>$49 — 30 directories</li>
            <li>$99 — 70 directories</li>
            <li>$149 — 100+ directories</li>
          </ul>
          <Link
            href="/directories"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-ink-900 px-4 py-2.5 text-[14px] font-medium text-paper-100 transition hover:bg-ember-500"
          >
            Do it for me →
          </Link>
        </div>
      </aside>

      {/* upsell popup */}
      {upsell && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-ink-900/15 bg-paper-100 p-7 shadow-lift">
            <div className="flex items-start justify-between">
              <Clock className="h-6 w-6 text-ember-600" />
              <button
                type="button"
                onClick={() => setUpsell(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-paper-200 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-ink-900">
              This is going to take a while.
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              Submitting to all 120 by hand is ~70 hours of the same form, over and over. We do it
              for you — do-follow only, hand-picked to your niche, with a full report.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["$49", "30 dirs"],
                ["$99", "70 dirs"],
                ["$149", "100+"],
              ].map(([p, l]) => (
                <div key={l} className="rounded-lg border border-ink-900/12 bg-paper-50 py-3">
                  <div className="figure text-lg font-semibold text-ink-900">{p}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-400">
                    {l}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/directories"
                className="flex-1 rounded-lg bg-ember-500 px-4 py-2.5 text-center text-[14px] font-semibold text-paper-50 transition hover:bg-ember-600"
              >
                Do it for me
              </Link>
              <button
                type="button"
                onClick={() => setUpsell(false)}
                className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"
              >
                I&apos;ll grind
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DrBadge({ dr }: { dr: number }) {
  if (!dr) return null;
  const tone =
    dr >= 85
      ? "bg-brass-500 text-paper-50"
      : dr >= 70
        ? "bg-brass-400/25 text-brass-600"
        : dr >= 50
          ? "bg-ink-900/8 text-ink-600"
          : "bg-ink-900/5 text-ink-400";
  return (
    <span className={cn("figure rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold", tone)}>
      DR {dr}
    </span>
  );
}
