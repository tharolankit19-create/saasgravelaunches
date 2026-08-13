"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The upvote. Optimistic — the count moves the instant you click and rolls back
 * if the server disagrees. A signed-out click goes to sign-in and returns to
 * exactly what you were looking at.
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
    sm: "w-11 py-1 text-[11px]",
    md: "w-13 py-1.5 text-[12px]",
    lg: "w-16 py-2.5 text-sm",
  }[size];

  async function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
      return;
    }

    const previous = state;
    setState({ count: state.count + (state.upvoted ? -1 : 1), upvoted: !state.upvoted });
    setBump(true);
    setTimeout(() => setBump(false), 350);

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
        "group flex shrink-0 flex-col items-center justify-center gap-0 rounded-[3px] border transition-all active:translate-y-px",
        dims,
        state.upvoted
          ? "border-oxblood-500/40 bg-oxblood-500/10 text-oxblood-600"
          : "border-ink-900/16 bg-paper-100 text-ink-700 hover:border-oxblood-500/50 hover:bg-oxblood-500/5 hover:text-oxblood-600"
      )}
    >
      <ChevronUp
        className={cn("h-4 w-4 transition-transform group-hover:-translate-y-px", bump && "animate-pop")}
        strokeWidth={2.5}
      />
      <span className={cn("figure font-semibold leading-none", bump && "animate-pop")}>
        {state.count}
      </span>
    </button>
  );
}
