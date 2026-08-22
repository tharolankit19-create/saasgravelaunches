"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the Saasgrave register chrome (masthead, footer) on pages meant to
 * stand on their own. The Planets universe is a full-screen, dark, immersive
 * experience with its own minimal header — the sticky masthead and footer
 * would only break the mood.
 */
export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/planets";
  if (bare) return null;
  return <>{children}</>;
}
