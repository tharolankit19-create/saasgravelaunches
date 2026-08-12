"use client";

// Browser side of the telemetry. One random session id per tab, kept in
// sessionStorage so it dies when the tab does — no cookie, nothing that
// follows anyone between visits.

const KEY = "sgl_sid";

export function sessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return ""; // private mode — we simply lose session grouping
  }
}

/**
 * Fire an event. Best-effort by design: uses sendBeacon when the page may be
 * unloading, never awaits, and swallows every error. A blocked request must
 * never surface to the visitor.
 */
export function trackEvent(
  event: string,
  extra: { productSlug?: string; path?: string; meta?: Record<string, unknown> } = {}
): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    path: extra.path ?? window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    sessionId: sessionId(),
    productSlug: extra.productSlug,
    meta: extra.meta,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
