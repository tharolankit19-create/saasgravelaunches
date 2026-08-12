// ─── What we sell ───────────────────────────────────────────
// Launching is free, forever — that's the whole acquisition engine. The only
// money on the table is the rail beside the feed, sold by the calendar month,
// and one optional per-product upgrade.
//
// Every price lives here and nowhere else. Each one resolves to its OWN Dodo
// product: there is deliberately no shared fallback, because a fallback is how
// a $9 slot ends up charging $39.

export type ProductKey = "sidebar" | "feed" | "premium";

export type ProductSpec = {
  key: ProductKey;
  name: string;
  dollars: number;
  /** How the price is charged. */
  unit: string;
  /** Hard cap on concurrent slots. `null` = nothing to sell out. */
  slots: number | null;
  /** The row in `launch_ads.placement`, when this is an ad. */
  placement: "sidebar" | "feed" | null;
  tagline: string;
  perks: string[];
  /** The ONE env var naming this price's Dodo product. */
  envKey: string;
};

export const PRODUCTS: Record<ProductKey, ProductSpec> = {
  sidebar: {
    key: "sidebar",
    name: "Sidebar Slot",
    dollars: 9,
    unit: "/ month",
    slots: 3,
    placement: "sidebar",
    tagline: "Your product in the rail beside every launch, all month.",
    perks: [
      "Logo, headline and CTA in the right rail",
      "Shown on every page — feed, product pages, leaderboard",
      "Dofollow link to your site",
      "Click analytics in your dashboard",
      "A whole month · only 3 slots exist",
    ],
    envKey: "DODO_PRODUCT_ID_SIDEBAR_9",
  },
  feed: {
    key: "feed",
    name: "Feed Banner",
    dollars: 29,
    unit: "/ month",
    slots: 1,
    placement: "feed",
    tagline: "One banner inside the weekly board itself. Impossible to scroll past.",
    perks: [
      "A full-width sponsored card mid-feed",
      "The single most-seen block on the site",
      "Dofollow link to your site",
      "Exclusive — one banner per month, no rotation",
    ],
    envKey: "DODO_PRODUCT_ID_FEED_29",
  },
  premium: {
    key: "premium",
    name: "Premium Launch",
    dollars: 19,
    unit: "one-off, per product",
    slots: null,
    placement: null,
    tagline: "A verified badge and a richer SEO page that keeps earning after launch week.",
    perks: [
      "Verified badge on the board and your product page",
      "Priority placement among equal upvotes",
      "Full SEO block — FAQ, keywords, “alternative to” pages",
      "Keeps working long after your week ends",
    ],
    envKey: "DODO_PRODUCT_ID_PREMIUM_19",
  },
};

export const AD_PRODUCTS: ProductKey[] = ["sidebar", "feed"];
export const ALL_PRODUCTS: ProductKey[] = ["sidebar", "feed", "premium"];

export function isProductKey(v: unknown): v is ProductKey {
  return typeof v === "string" && v in PRODUCTS;
}

export function productCents(key: ProductKey): number {
  return PRODUCTS[key].dollars * 100;
}

/**
 * Which Dodo product to charge. Returns undefined when it isn't configured —
 * callers must fail loudly rather than substitute a different product.
 */
export function productDodoId(key: ProductKey): string | undefined {
  return process.env[PRODUCTS[key].envKey]?.trim() || undefined;
}

export function productEnvName(key: ProductKey): string {
  return PRODUCTS[key].envKey;
}

/** The payment `kind` a product settles into. */
export function kindFor(key: ProductKey): string {
  return key === "premium" ? "premium" : `ad_${key}`;
}

/** Slot indexes that exist for a placement, e.g. [1,2,3]. */
export function slotIndexes(key: Exclude<ProductKey, "premium">): number[] {
  const n = PRODUCTS[key].slots ?? 1;
  return Array.from({ length: n }, (_, i) => i + 1);
}

// ─── The free tier, spelled out ─────────────────────────────
// Written here so the landing page, the pricing page and the submit flow all
// promise exactly the same thing.
export const FREE_PERKS = [
  "A permanent product page with a dofollow backlink",
  "A spot on this week's board, ranked by real upvotes",
  "Comments from other makers, and a maker profile",
  "AI autofill — paste your URL, we write the listing",
  "Views, upvotes and outbound clicks in your dashboard",
];

/**
 * Launching costs nothing but it isn't free of effort: you support three other
 * makers before your own launch goes live. That single rule is what keeps the
 * board from becoming a wall of drive-by submissions nobody reads.
 */
export const SUPPORT_THRESHOLD = 3;
