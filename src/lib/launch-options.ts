// ─── What a maker is offered at the final step ──────────────
// The configure-launch step is the one moment a founder is already committed
// (the listing is written, the date is picked) and genuinely open to spending.
// Everything offered here is resolved from PRODUCTS so a price can never drift
// between the pricing page and this step.
//
// Two rules this file exists to enforce:
//
//   1. Launching is ALWAYS free. Every paid row is opt-in, "Standard — Free" is
//      pre-selected, and the free path is never more than one click away. No
//      paywall, no forced redirect.
//   2. Exactly one paid thing can be bought at a time, because one purchase is
//      one Dodo product is one checkout. The directory tiers already bundle a
//      Featured week (see PRODUCTS), so picking one supersedes the Featured
//      row rather than stacking a second charge on top of it.

import { PRODUCTS, type ProductKey } from "@/lib/pricing";

export type TierKey = "free" | "featured";
export type AddonKey = "none" | "directory" | "directoryPro" | "directoryMax";

export type TierOption = {
  key: TierKey;
  name: string;
  price: number;
  /** The line a founder reads first. */
  tagline: string;
  perks: string[];
  /** Real, checkable scarcity — never a countdown we invented. */
  scarcity?: string;
};

export const LAUNCH_TIERS: TierOption[] = [
  {
    key: "free",
    name: "Standard",
    price: 0,
    tagline: "Everything you need to launch. Free, forever.",
    perks: [
      "A ranked place on your week's board",
      "A permanent product page with a dofollow backlink",
      "Comments and feedback from other makers",
      "Views, upvotes and outbound clicks in your dashboard",
    ],
  },
  {
    key: "featured",
    name: "Featured",
    price: PRODUCTS.featured.dollars,
    tagline: "Pinned above every other launch for your whole week.",
    perks: [
      "Pinned to the top of the board — the first thing anyone sees",
      "A Featured rule and label on your row all week",
      "Everything in Standard, kept forever",
      "Runs the full week, then releases the slot",
    ],
    scarcity: `Only ${PRODUCTS.featured.slots} exist per week`,
  },
];

export type AddonOption = {
  key: AddonKey;
  /** The Dodo product this settles into. `null` for "None". */
  product: ProductKey | null;
  name: string;
  price: number;
  blurb: string;
  perks: string[];
  /** Shown as a struck-through anchor. Only ever the honest sum of the parts. */
  worth?: number;
  /** True when the package already contains a Featured week. */
  includesFeatured?: boolean;
};

export const DIRECTORY_ADDONS: AddonOption[] = [
  {
    key: "none",
    product: null,
    name: "None",
    price: 0,
    blurb: "Just the launch — you can add this later from your dashboard.",
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
    worth:
      PRODUCTS.directoryMax.dollars + PRODUCTS.featured.dollars + PRODUCTS.premium.dollars,
    includesFeatured: true,
  },
];

/** The add-on a key names. */
export function addon(key: AddonKey): AddonOption {
  return DIRECTORY_ADDONS.find((a) => a.key === key) || DIRECTORY_ADDONS[0];
}

export function tier(key: TierKey): TierOption {
  return LAUNCH_TIERS.find((t) => t.key === key) || LAUNCH_TIERS[0];
}

/**
 * What the maker actually pays, and which single product to charge.
 *
 * A directory package already carries a Featured week, so it replaces the
 * Featured row instead of charging for it twice. That's the whole reason this
 * resolves centrally rather than being summed in the component.
 */
export function resolveSelection(t: TierKey, a: AddonKey): {
  product: ProductKey | null;
  total: number;
  /** True when Featured is included by the add-on rather than paid for. */
  featuredIncluded: boolean;
} {
  const add = addon(a);
  if (add.product) {
    return { product: add.product, total: add.price, featuredIncluded: !!add.includesFeatured };
  }
  if (t === "featured") {
    return { product: "featured", total: PRODUCTS.featured.dollars, featuredIncluded: false };
  }
  return { product: null, total: 0, featuredIncluded: false };
}
