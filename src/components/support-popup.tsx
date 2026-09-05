"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ExternalLink, Loader2, Heart, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

type Pick = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  upvote_count: number | null;
};

/**
 * The "support three makers" nudge, shown right before a launch. Optional by
 * design — you can continue any time — but it's how the board stays a community
 * and not a dumping ground. Upvote and visit three, then launch.
 */
export function SupportPopup({
  open,
  onContinue,
  onClose,
  publishing,
}: {
  open: boolean;
  onContinue: () => void;
  onClose: () => void;
  publishing?: boolean;
}) {
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open || picks) return;
    fetch("/api/support-picks")
      .then((r) => r.json())
      .then((d) => setPicks(d.picks || []))
      .catch(() => setPicks([]));
  }, [open, picks]);

  if (!open) return null;

  const supportedCount = picks ? picks.filter((p) => voted[p.id] || visited[p.id]).length : 0;
  const goal = Math.min(3, picks?.length || 3);

  async function upvote(p: Pick) {
    if (voted[p.id]) return;
    setBusy(p.id);
    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id }),
      });
      const data = await res.json();
      if (res.status === 401) {
        toast.error("Sign in to upvote.");
        return;
      }
      if (!res.ok) throw new Error(data?.error);
      setVoted((v) => ({ ...v, [p.id]: Boolean(data.upvoted) }));
      trackEvent("support_upvote", { productSlug: p.slug });
    } catch {
      toast.error("Couldn't register that vote.");
    } finally {
      setBusy(null);
    }
  }

  function visit(p: Pick) {
    if (!p.website_url) return;
    setVisited((v) => ({ ...v, [p.id]: true }));
    trackEvent("support_visit", { productSlug: p.slug });
    window.open(p.website_url, "_blank", "noopener");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-ink-900/10 bg-paper-100 p-6 shadow-lift">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-400 transition hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-ember-500/30 bg-ember-500/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-600">
          <Heart className="h-3 w-3" /> Before you launch
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink-900">Support 3 makers first</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">
          It&apos;s optional — but upvoting and visiting three products is how the board stays alive,
          and it&apos;s the spirit behind your free dofollow backlink. Give a little, get a little. 🔥
        </p>

        {/* progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-300">
            <div
              className="h-full rounded-full bg-ember-500 transition-all duration-500"
              style={{ width: `${(supportedCount / goal) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-ink-500">
            {supportedCount}/{goal}
          </span>
        </div>

        {/* picks */}
        <div className="mt-5 space-y-2.5">
          {picks === null ? (
            <div className="flex items-center justify-center py-8 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : picks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink-900/20 bg-paper-50 px-4 py-6 text-center text-[13px] text-ink-500">
              No one else to support yet — you might be the first. Launch away!
            </p>
          ) : (
            picks.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-paper-50 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo_url || ""}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-xl border border-ink-900/10 bg-paper-200 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink-900">{p.name}</p>
                  {p.tagline && <p className="truncate text-[12px] text-ink-500">{p.tagline}</p>}
                </div>
                <button
                  onClick={() => visit(p)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-medium transition",
                    visited[p.id]
                      ? "border-moss-500/40 bg-moss-500/10 text-moss-600"
                      : "border-ink-900/15 text-ink-600 hover:border-ink-900/35"
                  )}
                >
                  <ExternalLink className="h-3 w-3" /> Visit
                </button>
                <button
                  onClick={() => upvote(p)}
                  disabled={busy === p.id || voted[p.id]}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition",
                    voted[p.id]
                      ? "bg-ember-500 text-white"
                      : "bg-ink-900 text-white hover:bg-ember-500"
                  )}
                >
                  {busy === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                  {voted[p.id] ? p.upvote_count! + 1 : "Upvote"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* actions */}
        <button
          onClick={onContinue}
          disabled={publishing}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ember-500 text-[15px] font-semibold text-white transition hover:bg-ember-600 disabled:opacity-50"
        >
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {supportedCount >= goal ? "Launch my product" : "Continue to launch"}
          {!publishing && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          You can launch without supporting — but the makers you help today are the ones who&apos;ll
          upvote you back.
        </p>
      </div>
    </div>
  );
}
