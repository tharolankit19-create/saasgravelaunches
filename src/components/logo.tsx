import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark: a register entry. A ruled block with an ascending stroke crossing
 * it — a line in a ledger that goes up. Squared corners and a single oxblood
 * fill, so it reads as a stamp rather than an app icon, and so it's still
 * legible at 16px in a browser tab.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="4" fill="#8c2323" />
      <path d="M7 11h18" stroke="#fffdf9" strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
      <path d="M7 25h18" stroke="#fffdf9" strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
      <path
        d="M8.5 21.5 16 10.5l7.5 11"
        stroke="#fffdf9"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The same mark as a data URI, for OG images (Satori can't nest components). */
export function logoMarkDataUri(size = 512) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#8c2323"/><path d="M7 11h18" stroke="#fffdf9" stroke-width="1.6" opacity="0.4" stroke-linecap="round"/><path d="M7 25h18" stroke="#fffdf9" stroke-width="1.6" opacity="0.4" stroke-linecap="round"/><path d="M8.5 21.5 16 10.5l7.5 11" stroke="#fffdf9" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * The wordmark. "Saasgrave" is the parent brand and stays quiet; "Launches" is
 * this surface and carries the weight — one masthead, two levels of hierarchy.
 */
export function Logo({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark size={compact ? 24 : 28} />
      <span className="leading-none">
        <span
          className={cn(
            "block font-mono uppercase tracking-[0.18em] text-ink-400 transition-all",
            compact ? "text-[8px]" : "text-[9px]"
          )}
        >
          Saasgrave
        </span>
        <span
          className={cn(
            "block font-serif font-semibold tracking-tight text-ink-900 transition-all group-hover:text-oxblood-600",
            compact ? "text-[15px]" : "text-[18px]"
          )}
        >
          Launches
        </span>
      </span>
    </Link>
  );
}
