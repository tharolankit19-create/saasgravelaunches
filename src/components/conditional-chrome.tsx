"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the Saasgrave register chrome (masthead, footer) on pages that are
 * meant to stand on their own. The Spotlight is the outbid-style board — it
 * carries its own minimal header, so the sticky masthead, nav and leaderboard
 * furniture would only dilute that feel.
 */
export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/spotlight";
  if (bare) return null;
  return <>{children}</>;
}
