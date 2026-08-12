"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The upvote. Optimistic — the count moves the instant you click, and rolls
 * back if the server disagrees. A signed-out click sends you to sign in and
 * comes straight back to what you were looking at.
 */
export function UpvoteButton({
  productId,
  slug,
  count,
  upvoted,
  signedIn,
  size = "md",
}: {
  productId: string;
  slug: string;
  count: number;
  upvoted: boolean;
  signedIn: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [state, setState] = useState({ count, upvoted });
  const [pending, start] = useTransition();
  const [bump, setBump] = useState(false);

  const dims = {
    sm: "w-12 py-1.5 text-[11px]",
    md: "w-14 py-2 text-xs",
    lg: "w-16 py-2.5 text-sm",
  }[size];

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }

    const previous = state;
    const next = { count: state.count + (state.upvoted ? -1 : 1), upvoted: !state.upvoted };
    setState(next);
    setBump(true);
    setTimeout(() => setBump(false), 360);

    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't register that vote.");

      setState({ count: data.count, upvoted: data.upvoted });
      if (data.upvoted) trackEvent("upvote", { productSlug: slug });
      // The support gate counts upvotes, so the submit page may have changed.
      start(() => router.refresh());
    } catch (e: any) {
      setState(previous);
      toast.error(e?.message || "Couldn't register that vote.");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={state.upvoted}
      aria-label={state.upvoted ? "Remove upvote" : "Upvote"}
      className={cn(
        "group flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border font-mono font-semibold transition-all active:scale-95",
        dims,
        state.upvoted
          ? "border-violet-500/30 bg-violet-500/10 text-violet-600"
          : "border-ink-900/10 bg-paper-100 text-ink-700 hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600"
      )}
    >
      <ArrowUp
        className={cn(
          "h-4 w-4 transition-transform group-hover:-translate-y-0.5",
          bump && "animate-pop"
        )}
        strokeWidth={2.5}
      />
      <span className={cn(bump && "animate-pop")}>{state.count}</span>
    </button>
  );
}
