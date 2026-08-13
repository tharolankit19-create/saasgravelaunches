// ─── What we sell ───────────────────────────────────────────
// Four things, and no more. Every extra option is a decision between a maker
// and a finished launch, and the board only grows if launching itself is free.
//
//   Launch            free, forever          — one launch a week
//   Featured          $9  / launch week      — pinned to the top of that week
//   Sidebar Slot      $19 / month            — the rail beside every page
//   Directory Blast   $99 one-off            — 100+ directories, submitted by hand
//   Premium           $29 / month            — unlimited launches + full analytics
//
// Every price lives here and nowhere else, and each resolves to its OWN Dodo
// product. There is deliberately no shared fallback: a fallback is how a $9
// upgrade ends up charging $99.

export type ProductKey = "featured" | "sidebar" | "feed" | "directory" | "premium";

/** How a purchase is charged, which decides how it expires. */
export type Billing = "week" | "month" | "once" | "subscription";

export type ProductSpec = {
  key: ProductKey;
  name: string;
  /** Numeric price in USD — used for our own ledger only. The real charge is
   *  whatever the linked Dodo product is configured at. */
  dollars: number;
  /** Optional display override, for a price we want shown in another currency
   *  (e.g. the ₹1,00,000 Prime slot). Dodo remains the source of truth for the
   *  actual charge; this is only what the buyer reads. */
  priceLabel?: string;
  billing: Billing;
  /** Short human unit, e.g. "/ launch week". */
  unit: string;
  /** Hard cap on concurrent slots. `null` = nothing to sell out. */
  slots: number | null;
  /** The row in `launch_ads.placement`, when this is an ad. */
  placement: "sidebar" | "feed" | null;
  /** One line: what the buyer actually gets. */
  tagline: string;
  perks: string[];
  /** The ONE env var naming this price's Dodo product. */
  envKey: string;
};

export const PRODUCTS: Record<ProductKey, ProductSpec> = {
  featured: {
    key: "featured",
    name: "Featured",
    dollars: 9,
    billing: "week",
    unit: "/ launch week",
    slots: 3,
    placement: null,
    tagline: "Pinned above the board for your whole launch week.",
    perks: [
      "Pinned to the top of the week's board",
      "A Featured rule and label on your row",
      "Runs the full ISO week, then releases the slot",
      "Only 3 exist per week — genuinely scarce",
    ],
    envKey: "DODO_PRODUCT_ID_FEATURED_9",
  },
  sidebar: {
    key: "sidebar",
    name: "Sidebar Slot",
    dollars: 19,
    billing: "month",
    unit: "/ month",
    slots: 3,
    placement: "sidebar",
    tagline: "Your product in the rail beside every page, all month.",
    perks: [
      "Logo, headline and CTA in the right rail",
      "On every page — board, product pages, archive",
      "Dofollow link to your site",
      "Click analytics in your dashboard",
      "A whole month · only 3 slots exist",
    ],
    envKey: "DODO_PRODUCT_ID_SIDEBAR_19",
  },
  feed: {
    key: "feed",
    name: "Prime Slot",
    // Displayed in rupees per the operator's pricing; the real charge is set on
    // the linked Dodo product. `dollars` is only our internal ledger figure.
    dollars: 1200,
    priceLabel: "₹1,00,000",
    billing: "month",
    unit: "/ month",
    slots: 1,
    placement: "feed",
    tagline: "One banner inside the board, right below the top three. The single most-seen spot.",
    perks: [
      "A full-width sponsored card in the weekly board itself",
      "Sits directly under the #3 launch — impossible to scroll past",
      "Dofollow link + your logo, headline and CTA",
      "Exclusive — one banner per month, no rotation",
      "Click analytics in your dashboard",
    ],
    envKey: "DODO_PRODUCT_ID_FEED_PRIME",
  },
  directory: {
    key: "directory",
    name: "Directory Blast",
    dollars: 99,
    billing: "once",
    unit: "one-off",
    slots: null,
    placement: null,
    tagline: "We submit your product to 100+ directories by hand.",
    perks: [
      "Submitted to 100+ startup and SaaS directories",
      "Done manually, by a human — no bots, no spam",
      "A report with every live link when it's finished",
      "Turnaround within 7 days",
      "Roughly 70 hours of work you don't do",
    ],
    envKey: "DODO_PRODUCT_ID_DIRECTORY_99",
  },
  premium: {
    key: "premium",
    name: "Premium",
    dollars: 29,
    billing: "subscription",
    unit: "/ month",
    slots: null,
    placement: null,
    tagline: "Launch as often as you like, and see exactly what each one did.",
    perks: [
      "Unlimited launches — no one-a-week limit",
      "Full maker analytics: views, clicks, upvote velocity, referrers",
      "Verified badge on the board and your product pages",
      "AI Launch Copilot on every draft",
      "Live embed widgets for your own site",
      "Cancel any time — nothing is locked behind renewal",
    ],
    envKey: "DODO_PRODUCT_ID_PREMIUM_29",
  },
};

/** Display order on the pricing page: cheapest commitment first. */
export const PRODUCT_ORDER: ProductKey[] = ["featured", "sidebar", "feed", "premium", "directory"];

/** The one we steer people towards. */
export const MOST_PICKED: ProductKey = "premium";

export function isProductKey(v: unknown): v is ProductKey {
  return typeof v === "string" && v in PRODUCTS;
}

export function productCents(key: ProductKey): number {
  return PRODUCTS[key].dollars * 100;
}

/** What the buyer reads for a price — the override if set, else the dollar figure. */
export function priceDisplay(key: ProductKey): string {
  return PRODUCTS[key].priceLabel || `$${PRODUCTS[key].dollars}`;
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
  if (key === "sidebar") return "ad_sidebar";
  if (key === "feed") return "ad_feed";
  return key;
}

/** Slot indexes that exist for a placement, e.g. [1,2,3]. */
export function slotIndexes(key: ProductKey): number[] {
  const n = PRODUCTS[key].slots ?? 1;
  return Array.from({ length: n }, (_, i) => i + 1);
}

// ─── Free vs paid, stated once ──────────────────────────────

/**
 * Launches per ISO week on the free tier. Premium lifts this entirely — it's
 * the clearest thing a subscription can buy without touching the ranking.
 */
export const FREE_LAUNCHES_PER_WEEK = 1;

/** Written here so the landing page, pricing page and submit flow agree. */
export const FREE_PERKS = [
  "A permanent product page with a dofollow backlink",
  "A ranked place on the week's board",
  "Comments and feedback from other makers",
  "AI autofill — paste your URL, we write the listing",
  "Views, upvotes and outbound clicks in your dashboard",
  "An embeddable badge for your own site",
];

/** What only Premium unlocks — the honest, short version. */
export const PREMIUM_ONLY = [
  "More than one launch a week",
  "Full analytics with daily charts and referrers",
  "AI Launch Copilot",
  "Verified badge",
];

/**
 * Support-three-makers-first is the anti-spam rule — but it can only exist once
 * there ARE makers to support. On a board with a handful of launches, asking a
 * founder to upvote three others before their own is impossible, so the gate
 * stays OFF until the platform has real depth.
 *
 * It switches on automatically once there are at least this many live products.
 */
export const SUPPORT_THRESHOLD = 3;
export const SUPPORT_GATE_MIN_PRODUCTS = 60;
