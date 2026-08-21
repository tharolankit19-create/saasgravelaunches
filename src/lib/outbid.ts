// ─── Pay-to-rank: the Spotlight auction ─────────────────────
// One board, no login, no ads. Drop your SaaS link, name a bid, pay. The
// highest live bid sits at #1. Every bid is good for 24 hours, then it drops
// off unless someone re-bids. Pure psychology — competition + FOMO + status.
//
// Client-safe: no server imports here. The DB writes live in the API route and
// the webhook; this file is just the shape, the maths and the link builder.

/** Hours a paid bid stays on the board before it expires. */
export const OUTBID_HOURS = 24;

/** Floor bid, in whole dollars. A dollar gets you on the board; climbing costs more. */
export const OUTBID_MIN_DOLLARS = 1;

/** Sane ceiling so a fat-fingered quantity can't ask for a million-dollar charge. */
export const OUTBID_MAX_DOLLARS = 1_000_000;

// The hosted Dodo product for custom bids. It must be priced so that
// `quantity` × unit = the bid — i.e. a $1/unit "pay-what-you-want" product,
// with quantity carrying the dollar amount. Override the link or the unit
// price via env without a deploy.
const OUTBID_LINK = "https://checkout.dodopayments.com/buy/pdt_0NloRH53R9K6gpPSvvea4";

export function outbidPaymentBase(): string {
  return process.env.OUTBID_DODO_LINK?.trim() || OUTBID_LINK;
}

/** Dollars per Dodo quantity unit. Default $1 → quantity == bid dollars. */
export function outbidUnitDollars(): number {
  const v = Number(process.env.OUTBID_UNIT_DOLLARS);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/**
 * The checkout link for one bid. The bid's token rides along as metadata so
 * the webhook can activate that exact row, and `redirect_url` brings the
 * bidder back to the board once they've paid.
 */
export function outbidCheckoutLink(
  token: string,
  amountDollars: number,
  redirectUrl?: string
): string {
  const url = new URL(outbidPaymentBase());
  const quantity = Math.max(1, Math.round(amountDollars / outbidUnitDollars()));
  url.searchParams.set("quantity", String(quantity));
  url.searchParams.set("metadata_kind", "outbid");
  url.searchParams.set("metadata_bid_token", token);
  if (redirectUrl) url.searchParams.set("redirect_url", redirectUrl);
  return url.toString();
}

/** A URL-safe random token — the bidder's key, and the webhook's match. */
export function newBidToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type NormalizedEntry = {
  /** Stable key used to de-dupe and rank one product across many bids. */
  entryKey: string;
  /** Where the row actually links to. */
  url: string;
  /** Short label shown on the row (host or @handle). */
  display: string;
  /** A guessed product name from the domain, for the row title. */
  name: string;
  /** The @handle, when the input was a handle rather than a URL. */
  handle: string | null;
};

/**
 * Turn "your product URL or @handle" into something we can rank and show.
 * Returns null if it's clearly neither.
 */
export function normalizeEntry(input: string): NormalizedEntry | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // A handle: "@name" or a bare "name" with no dot and no slash.
  const handleMatch = raw.match(/^@?([A-Za-z0-9_]{1,30})$/);
  if (raw.startsWith("@") || (handleMatch && !raw.includes("."))) {
    const h = handleMatch?.[1];
    if (!h) return null;
    return {
      entryKey: `@${h.toLowerCase()}`,
      url: `https://x.com/${h}`,
      display: `@${h}`,
      name: `@${h}`,
      handle: `@${h}`,
    };
  }

  // Otherwise a URL. Tolerate a missing protocol.
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!u.hostname.includes(".")) return null;

  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  const path = u.pathname.replace(/\/+$/, "").toLowerCase();
  const label = host.split(".").slice(-2, -1)[0] || host;

  return {
    entryKey: host + path,
    url: u.toString(),
    display: host + (path && path !== "/" ? path : ""),
    name: label.charAt(0).toUpperCase() + label.slice(1),
    handle: null,
  };
}

export type BidRow = {
  id: string;
  entry_key: string;
  display_url: string | null;
  url: string;
  handle: string | null;
  product_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  amount_cents: number;
  status: string;
  clicks: number | null;
  public_token: string;
  activated_at: string | null;
  expires_at: string | null;
};

/**
 * The board: the single highest active bid per product, ranked by amount.
 * Bids are permanent — once paid they stay on the board, and the only way to
 * move up is to bid higher. Nothing expires.
 */
export function rankBids(rows: BidRow[]): BidRow[] {
  const best = new Map<string, BidRow>();
  for (const r of rows) {
    if (r.status !== "active") continue;
    const cur = best.get(r.entry_key);
    if (!cur || r.amount_cents > cur.amount_cents) best.set(r.entry_key, r);
  }
  return [...best.values()].sort((a, b) => b.amount_cents - a.amount_cents);
}

/** Dollars needed to sit at #1 next — one more than the current top. */
export function nextTopBid(topCents: number | null): number {
  if (!topCents || topCents <= 0) return OUTBID_MIN_DOLLARS;
  return Math.max(OUTBID_MIN_DOLLARS, Math.floor(topCents / 100) + 1);
}

export function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
