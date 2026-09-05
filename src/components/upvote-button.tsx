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
    sm: "w-11 py-1 text-[11px] gap-0",
    md: "w-14 py-2 text-[13px] gap-0.5",
    lg: "w-[68px] py-3.5 text-lg gap-1",
  }[size];

  const icon = { sm: "h-4 w-4", md: "h-4 w-4", lg: "h-5 w-5" }[size];

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
        "group flex shrink-0 flex-col items-center justify-center rounded-xl border transition-all active:translate-y-px",
        dims,
        state.upvoted
          ? "border-ember-500/50 bg-ember-500/12 text-ember-600 shadow-[0_1px_0_rgba(242,103,30,0.15)]"
          : "border-ink-900/16 bg-paper-100 text-ink-700 hover:-translate-y-px hover:border-ember-500/50 hover:bg-ember-500/5 hover:text-ember-600 hover:shadow-card"
      )}
    >
      <ChevronUp
        className={cn(icon, "transition-transform group-hover:-translate-y-px", bump && "animate-pop")}
        strokeWidth={2.75}
      />
      <span className={cn("figure font-semibold leading-none", bump && "animate-pop")}>
        {state.count}
      </span>
    </button>
  );
}
