// ─── Dodo Payments ──────────────────────────────────────────
// Server-only. We create a hosted checkout and let Dodo (a Merchant of Record)
// handle cards, tax and compliance. The webhook is the source of truth for
// "paid" — the redirect alone is never trusted.
// Docs: https://docs.dodopayments.com

const TEST_BASE = "https://test.dodopayments.com";
const LIVE_BASE = "https://live.dodopayments.com";

function apiKey(): string | undefined {
  return process.env.DODO_API_KEY?.trim().replace(/^Bearer\s+/i, "") || undefined;
}

function isLiveMode(): boolean {
  const m = (process.env.DODO_ENV || "").toLowerCase();
  return m.includes("live") || m.includes("prod");
}

export type CheckoutArgs = {
  kind: string;
  referenceId: string;
  userId: string;
  email?: string;
  successUrl: string;
  /** Required — the Dodo product for exactly this price. */
  productId?: string;
  /** Env var name to quote when it's missing, so the error is actionable. */
  productEnvName?: string;
  /** DataFast visitor id (from the datafast_visitor_id cookie) for revenue attribution. */
  visitorId?: string;
};

export async function createDodoCheckout({
  kind,
  referenceId,
  userId,
  email,
  successUrl,
  productId,
  productEnvName,
  visitorId,
}: CheckoutArgs): Promise<string> {
  const key = apiKey();
  const resolved = productId?.trim();

  if (!key) throw new Error("Payments aren't set up yet — DODO_API_KEY is missing.");
  if (!resolved) {
    throw new Error(
      `This isn't set up for payment yet — ${productEnvName || "its Dodo product ID"} is missing. ` +
        "Create a Dodo product at the right price and set that environment variable."
    );
  }

  const payload = {
    product_cart: [{ product_id: resolved, quantity: 1 }],
    return_url: successUrl,
    customer: email ? { email } : undefined,
    metadata: {
      kind,
      reference_id: referenceId,
      user_id: userId,
      // DataFast revenue attribution — links this payment back to the visitor.
      ...(visitorId ? { datafast_visitor_id: visitorId } : {}),
    },
  };

  // Try the configured environment first; on a 401 (a test key pointed at live,
  // or the reverse) fall through to the other one so a mismatched DODO_ENV
  // doesn't block a perfectly good key.
  const primary = isLiveMode() ? LIVE_BASE : TEST_BASE;
  const fallback = primary === LIVE_BASE ? TEST_BASE : LIVE_BASE;

  let res = await post(primary, key, payload);
  if (res.status === 401) res = await post(fallback, key, payload);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error(
        "Dodo rejected the API key (401). Re-copy it from Dodo → Developer → API Keys and make sure DODO_ENV matches (test key → test_mode, live key → live_mode)."
      );
    }
    console.error(`Dodo checkout failed (${res.status}): ${text}`);
    throw new Error(`Checkout couldn't start (Dodo ${res.status}). Please try again.`);
  }

  const data = (await res.json()) as { checkout_url?: string; payment_link?: string; url?: string };
  const url = data.checkout_url || data.payment_link || data.url;
  if (!url) throw new Error("Dodo returned no checkout URL.");
  return url;
}

/**
 * Ask Dodo whether a payment actually succeeded.
 *
 * The webhook stays the source of truth, but it can be slow or unconfigured and
 * a buyer who just paid must not be stranded. The success page calls this to
 * confirm and unlock immediately.
 *
 * `null` means "can't tell" (no key, network error, still processing) — callers
 * treat that as not-yet-confirmed rather than failed.
 */
export async function verifyDodoPayment(paymentId: string): Promise<boolean | null> {
  const key = apiKey();
  if (!key || !paymentId) return null;

  const primary = isLiveMode() ? LIVE_BASE : TEST_BASE;
  const fallback = primary === LIVE_BASE ? TEST_BASE : LIVE_BASE;

  for (const base of [primary, fallback]) {
    let res: Response;
    try {
      res = await fetch(`${base}/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
    } catch {
      continue;
    }
    if (res.status === 401 || res.status === 404) continue;
    if (!res.ok) return null;

    const data: any = await res.json().catch(() => null);
    if (!data) return null;
    const status = String(data.status || data.payment_status || "").toLowerCase();
    if (!status) return null;
    if (["succeeded", "success", "paid", "completed", "active"].includes(status)) return true;
    if (["failed", "cancelled", "canceled", "expired", "refunded"].includes(status)) return false;
    return null;
  }
  return null;
}

function post(base: string, key: string, payload: unknown) {
  return fetch(`${base}/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
