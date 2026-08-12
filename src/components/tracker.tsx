"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/track-client";

/**
 * Fires one `page_view` per navigation, plus an optional `product_view` when
 * the page is a product. Mounted once in the layout; the ref guard stops
 * React's development double-invoke from double-counting.
 */
export function Tracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const path = pathname + (search.toString() ? `?${search.toString()}` : "");
    if (last.current === path) return;
    last.current = path;

    trackEvent("page_view", { path });

    const product = /^\/products\/([^/?#]+)/.exec(pathname)?.[1];
    if (product) trackEvent("product_view", { path, productSlug: product });
  }, [pathname, search]);

  return null;
}

/** Fires a single event when the component mounts. */
export function TrackOnMount({
  event,
  productSlug,
  meta,
}: {
  event: string;
  productSlug?: string;
  meta?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, { productSlug, meta });
  }, [event, productSlug, meta]);
  return null;
}
