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

export type ProductKey =
  | "featured"
  | "sidebar"
  | "feed"
  | "directory"
  | "directoryPro"
  | "directoryMax"
  | "premium";

/** How a purchase is charged, which decides how it expires. */
export type Billing = "week" | "month" | "once" | "subscription";

export type ProductSpec = {
  key: ProductKey;
  name: string;
  /** Numeric price in USD — used for our own ledger only. The real charge is
   *  whatever the linked Dodo product is configured at. */
  dollars: number;
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
    dollars: 29,
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
    name: "Starter List",
    dollars: 99,
    billing: "once",
    unit: "one-off",
    slots: null,
    placement: null,
    tagline: "40+ directories, submitted by hand — plus a free launch on the board.",
    perks: [
      "Submitted to 40+ startup & SaaS directories by hand",
      "Do-follow links only — no-follow is a waste of your time",
      "A free launch on Saasgrave Launches included (dofollow backlink)",
      "A full report with every live link",
      "We start within 48 hours",
    ],
    envKey: "DODO_PRODUCT_ID_DIRECTORY_99",
  },
  directoryPro: {
    key: "directoryPro",
    name: "Growth List",
    dollars: 149,
    billing: "once",
    unit: "one-off",
    slots: null,
    placement: null,
    tagline: "80+ high-DR directories, do-follow only, plus a Featured week.",
    perks: [
      "Submitted to 80+ high-DR directories by hand",
      "Only high-Domain-Rating directories — real SEO weight",
      "A Featured week on Saasgrave Launches included",
      "Priority queue — we start within 24 hours",
      "Advanced report with the DR of every listing",
      "Roughly 45 hours of copy-pasting you never touch",
    ],
    envKey: "DODO_PRODUCT_ID_DIRECTORY_PRO",
  },
  directoryMax: {
    key: "directoryMax",
    name: "Premium List",
    dollars: 199,
    billing: "once",
    unit: "one-off",
    slots: null,
    placement: null,
    tagline: "120+ high-DR directories, do-follow only — the full weekend, bought back.",
    perks: [
      "Submitted to 120+ high-DR directories by hand",
      "Only the highest-DR directories, hand-picked to your niche",
      "A Featured week + one month of Premium included",
      "Top priority — we start within 24 hours",
      "Advanced report: every link, DR and status",
      "Roughly 70 hours of work you don't do",
    ],
    envKey: "DODO_PRODUCT_ID_DIRECTORY_MAX",
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
export const PRODUCT_ORDER: ProductKey[] = [
  "featured",
  "sidebar",
  "feed",
  "premium",
  "directory",
  "directoryPro",
  "directoryMax",
];

/** The one we steer people towards. */
export const MOST_PICKED: ProductKey = "premium";

export function isProductKey(v: unknown): v is ProductKey {
  return typeof v === "string" && v in PRODUCTS;
}

export function productCents(key: ProductKey): number {
  return PRODUCTS[key].dollars * 100;
}

/** What the buyer reads for a price. */
export function priceDisplay(key: ProductKey): string {
  return `$${PRODUCTS[key].dollars}`;
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
  // All directory tiers are the same human-fulfilled service — they settle as
  // one kind, and the amount on the ledger tells the tiers apart.
  if (key === "directory" || key === "directoryPro" || key === "directoryMax") return "directory";
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

/**
 * How many FREE (non-Premium) launches a single week can hold. Once a week is
 * full, free makers pick another week — or take Premium, which launches into
 * any week, full or not. Premium launches don't count against this cap.
 */
export const WEEK_SLOT_CAP = 20;
