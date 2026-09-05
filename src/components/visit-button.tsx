"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The outbound link to a maker's site — the whole reason they launched here.
 *
 * Dofollow on purpose: a directory that nofollows every listing is asking
 * makers to pay in effort for nothing. The click is counted so the maker can
 * see the traffic we actually sent them.
 */
export function VisitButton({
  href,
  slug,
  label = "Visit",
  className,
  variant = "primary",
}: {
  href: string;
  slug: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
}) {
  const styles =
    variant === "primary"
      ? "bg-ink-900 text-white hover:bg-ember-500"
      : "border border-ink-900/12 bg-paper-100 text-ink-900 hover:border-ember-500/40 hover:text-ember-600";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => {
        trackEvent("outbound_click", { productSlug: slug });
        fetch("/api/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
          keepalive: true,
        }).catch(() => {});
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-card transition active:scale-[0.98]",
        styles,
        className
      )}
    >
      {label}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  );
}
