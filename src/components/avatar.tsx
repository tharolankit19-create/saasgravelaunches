"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";

/**
 * A maker avatar. Plain <img> rather than next/image: these are arbitrary
 * remote URLs from Google, GitHub and Supabase storage. If one 404s or a
 * favicon guess turns out wrong, we quietly fall back to initials instead of
 * showing the browser's broken-image glyph — which is what was making logos
 * look "missing" on the board.
 */
export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Maker"}
        style={dim}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full border border-ink-900/8 object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-ink-900/8 bg-paper-300 font-medium text-ink-500",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/** A product logo — square, rounded, same fallback behaviour. */
export function ProductLogo({
  src,
  name,
  size = 56,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name || "Product"} logo`}
        style={dim}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-xl border border-ink-900/8 bg-paper-100 object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border border-ink-900/8 bg-gradient-to-br from-ember-400/25 to-brass-500/20 font-semibold text-ink-700",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
