"use client";

import { trackEvent } from "@/lib/track-client";

/**
 * An outbound advertiser link. Records the click for the buyer's dashboard,
 * then gets out of the way — the navigation is a plain anchor, so it still
 * works if the beacon is blocked.
 *
 * `rel` deliberately omits nofollow: the dofollow link is the thing being
 * sold, and it's stated as such on the pricing page.
 */
export function AdLink({
  adId,
  href,
  className,
  children,
}: {
  adId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => {
        trackEvent("ad_click", { meta: { adId } });
        fetch("/api/ads/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId }),
          keepalive: true,
        }).catch(() => {});
      }}
    >
      {children}
    </a>
  );
}
