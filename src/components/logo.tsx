import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark: a launch chevron rising out of a baseline, drawn in one stroke.
 * Related to Saasgrave's headstone silhouette — same weight, same geometry —
 * but pointing up rather than standing still, which is the whole difference
 * between the two products.
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
      <rect width="32" height="32" rx="9" fill="#5B3DF5" />
      <path
        d="M9 20.5 16 9.5l7 11"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.5 24h9" stroke="white" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** The same mark as a data URI, for OG images (Satori can't nest components). */
export function logoMarkDataUri(size = 512) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#5B3DF5"/><path d="M9 20.5 16 9.5l7 11" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 24h9" stroke="white" stroke-width="2.6" stroke-linecap="round" opacity="0.55"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark size={30} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
      <span className="text-[17px] font-semibold tracking-tight text-ink-900">
        Saasgrave<span className="text-violet-500"> Launches</span>
      </span>
    </Link>
  );
}
