// ─── What a maker is offered at the final step ──────────────
// The configure step is the one moment a founder is already committed — the
// listing is written, the week is picked — and genuinely open to spending.
// Everything offered here resolves from PRODUCTS so a price can never drift
// between the pricing page and this step.
//
// The order is deliberate. Paid leads, because the paid options are the ones
// that actually remove work: a free launch costs the maker a badge on their own
// site and a verification round-trip, and that cost is stated plainly rather
// than hidden. Free is still there, still one click, and still publishes a real
// listing with a real dofollow link — we just stop pretending the two options
// are equivalent, because they aren't.
//
// One rule this file exists to enforce: exactly one paid thing can be bought at
// a time, because one purchase is one Dodo product is one checkout. The
// directory tiers already bundle a Featured week, so picking one supersedes the
// Featured row rather than stacking a second charge on top of it.

import { PRODUCTS, type ProductKey } from "@/lib/pricing";

/** How the launch publishes. */
export type TierKey = "premium" | "featured" | "free";
export type AddonKey = "none" | "directory" | "directoryPro" | "directoryMax";

export type TierOption = {
  key: TierKey;
  name: string;
  price: number;
  /** The line a founder reads first. */
  tagline: string;
  perks: string[];
  /** What this costs the maker in effort, when it isn't money. */
  effort?: string;
  /** Real, checkable scarcity — never a countdown we invented. */
  scarcity?: string;
  /** Honest sum of the parts, shown as a struck-through anchor. */
  worth?: number;
  badge?: string;
};

export const LAUNCH_TIERS: TierOption[] = [
  {
    key: "premium",
    name: "Premium Launch",
    price: PRODUCTS.premiumLaunch.dollars,
    tagline: "Publishes the moment you pay. Nothing to add to your site.",
    perks: PRODUCTS.premiumLaunch.perks,
    badge: "Recommended",
    // Featured + a month of the subscription's verified mark is what this
    // replicates for one launch, so that's the honest comparison.
    worth: PRODUCTS.featured.dollars + PRODUCTS.premium.dollars,
  },
  {
    key: "featured",
    name: "Featured",
    price: PRODUCTS.featured.dollars,
    tagline: "Pinned above every other launch for your whole week.",
    perks: [
      "Pinned to the top of the board — the first thing anyone sees",
      "A Featured rule and label on your row all week",
      "A permanent dofollow backlink, kept forever",
      "Runs the full week, then releases the slot",
    ],
    effort: "Still needs our badge on your site to publish.",
    scarcity: `Only ${PRODUCTS.featured.slots} exist per week`,
  },
  {
    key: "free",
    name: "Standard",
    price: 0,
    tagline: "A ranked place on the board and a permanent page.",
    perks: [
      "A ranked place on your week's board",
      "A permanent product page with a dofollow backlink",
      "Views, upvotes and outbound clicks in your dashboard",
    ],
    effort:
      "You add our badge to your site and we verify it before your launch publishes. If we can't find it, the launch stays a draft.",
  },
];

/** True when this tier publishes without the maker touching their own site. */
export function skipsBadge(t: TierKey): boolean {
  return t === "premium";
}

export type AddonOption = {
  key: AddonKey;
  /** The Dodo product this settles into. `null` for "None". */
  product: ProductKey | null;
  name: string;
  price: number;
  blurb: string;
  perks: string[];
  worth?: number;
  /** True when the package already contains a Featured week. */
  includesFeatured?: boolean;
};

export const DIRECTORY_ADDONS: AddonOption[] = [
  {
    key: "none",
    product: null,
    name: "No directory submissions",
    price: 0,
    blurb: "Just this launch — you can add submissions later from your dashboard.",
    perks: [],
  },
  {
    key: "directory",
    product: "directory",
    name: "Starter — 30 directories",
    price: PRODUCTS.directory.dollars,
    blurb: "We submit you by hand to 30 high-DR directories.",
    perks: [
      "30 high-DR directories, submitted by hand",
      "Do-follow links only",
      "A full report with every live link",
      "We start within 48 hours",
    ],
  },
  {
    key: "directoryPro",
    product: "directoryPro",
    name: "Growth — 70 directories",
    price: PRODUCTS.directoryPro.dollars,
    blurb: "70 directories, plus your Featured week included.",
    perks: [
      "70 high-DR directories, submitted by hand",
      "A Featured week on this board included",
      "Priority queue — we start within 24 hours",
      "Advanced report with the DR of every listing",
    ],
    worth: PRODUCTS.directoryPro.dollars + PRODUCTS.featured.dollars,
    includesFeatured: true,
  },
  {
    key: "directoryMax",
    product: "directoryMax",
    name: "Premium — 100+ directories",
    price: PRODUCTS.directoryMax.dollars,
    blurb: "The whole weekend of copy-pasting, bought back.",
    perks: [
      "100+ of the highest-DR directories, picked for your niche",
      "A Featured week + one month of Premium included",
      "Top priority — we start within 24 hours",
      "Advanced report: every link, DR and status",
    ],
    worth: PRODUCTS.directoryMax.dollars + PRODUCTS.featured.dollars + PRODUCTS.premium.dollars,
    includesFeatured: true,
  },
];

export function addon(key: AddonKey): AddonOption {
  return DIRECTORY_ADDONS.find((a) => a.key === key) || DIRECTORY_ADDONS[0];
}

export function tier(key: TierKey): TierOption {
  return LAUNCH_TIERS.find((t) => t.key === key) || LAUNCH_TIERS[2];
}

export type Selection = {
  /** The single product to charge, or null for a free launch. */
  product: ProductKey | null;
  total: number;
  /** True when Featured comes from the add-on rather than being paid for. */
  featuredIncluded: boolean;
  /** What `/api/launch` is told, so it knows whether to hold the draft. */
  intent: "free" | "premium_launch";
  /** True when publishing needs the badge on the maker's own site. */
  needsBadge: boolean;
};

/**
 * What the maker actually pays, which single product to charge, and how the
 * launch publishes.
 *
 * A directory package already carries a Featured week, so it replaces the
 * Featured row instead of charging for it twice. That's the whole reason this
 * resolves centrally rather than being summed in the component.
 */
export function resolveSelection(t: TierKey, a: AddonKey): Selection {
  const add = addon(a);

  // A directory package is the top of the ladder: every tier of it already
  // includes a launch on this board, so buying one publishes the listing on
  // payment exactly like a Premium Launch — no badge, and no second charge for
  // the publish. It is therefore the single product charged.
  if (add.product) {
    return {
      product: add.product,
      total: add.price,
      featuredIncluded: !!add.includesFeatured,
      intent: "premium_launch",
      needsBadge: false,
    };
  }

  if (t === "premium") {
    return {
      product: "premiumLaunch",
      total: PRODUCTS.premiumLaunch.dollars,
      featuredIncluded: false,
      intent: "premium_launch",
      needsBadge: false,
    };
  }

  // Featured is a pin, not a way to publish — it still rides on the badge loop.
  if (t === "featured") {
    return {
      product: "featured",
      total: PRODUCTS.featured.dollars,
      featuredIncluded: false,
      intent: "free",
      needsBadge: true,
    };
  }

  return { product: null, total: 0, featuredIncluded: false, intent: "free", needsBadge: true };
}
