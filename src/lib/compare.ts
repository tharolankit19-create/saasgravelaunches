// ─── Comparison / alternatives data ─────────────────────────
// Programmatic SEO: "best places to launch a SaaS", "<platform> alternative".
// Kept factual and fair — category-true attributes, no invented metrics. Where
// a competitor's detail genuinely varies or isn't public, we say "varies"
// rather than assert something false, and every page carries a "verify on the
// platform" note.

export type Cell = "yes" | "no" | "varies";

/** The rows every comparison table shares. */
export const FEATURES: { key: string; label: string }[] = [
  { key: "free", label: "Free to launch" },
  { key: "permanent", label: "Permanent product page" },
  { key: "dofollow", label: "Dofollow backlink" },
  { key: "weekly", label: "Weekly ranked board" },
  { key: "browse", label: "Browse without an account" },
  { key: "directory", label: "Directory-submission service" },
  { key: "tools", label: "Free tools for founders" },
];

export type Platform = {
  slug: string;
  name: string;
  /** null for us — we're the anchor, not a comparison target. */
  us?: boolean;
  oneLiner: string;
  cells: Record<string, Cell>;
  /** Honest, fair prose for the /alternatives/[slug] page. Omitted for us. */
  their_strengths?: string[];
  our_edge?: string[];
  /** Search-friendly title fragment, e.g. "Product Hunt". */
  compareTitle?: string;
};

export const SAASGRAVE: Platform = {
  slug: "saasgrave-launches",
  name: "Saasgrave Launches",
  us: true,
  oneLiner:
    "Free weekly launchpad with a permanent product page and a real dofollow backlink you keep.",
  cells: {
    free: "yes",
    permanent: "yes",
    dofollow: "yes",
    weekly: "yes",
    browse: "yes",
    directory: "yes",
    tools: "yes",
  },
};

// Competitors / alternatives. Cells are conservative: only asserted where
// widely known; "varies" everywhere there's real ambiguity.
export const PLATFORMS: Platform[] = [
  {
    slug: "product-hunt",
    name: "Product Hunt",
    compareTitle: "Product Hunt",
    oneLiner:
      "The biggest launch community. Huge reach on the day — but outbound links are nofollow, so the SEO value fades with the spike.",
    cells: {
      free: "yes",
      permanent: "yes",
      dofollow: "no",
      weekly: "varies",
      browse: "yes",
      directory: "no",
      tools: "no",
    },
    their_strengths: [
      "By far the largest audience and the most launch-day traffic",
      "A launch that ranks can drive thousands of visits in 24 hours",
      "Strong community, hunters, and a well-known badge",
    ],
    our_edge: [
      "Your backlink is dofollow — it passes real SEO value, not just a spike",
      "A weekly board of ~20 is genuinely winnable; the PH front page rarely is",
      "Your page keeps working, and you get free directory tools on top",
    ],
  },
  {
    slug: "betalist",
    name: "BetaList",
    compareTitle: "BetaList",
    oneLiner:
      "A curated feed for early-stage startups. Good for early signups, but the free queue is slow and skipping it is paid.",
    cells: {
      free: "varies",
      permanent: "yes",
      dofollow: "varies",
      weekly: "no",
      browse: "yes",
      directory: "no",
      tools: "no",
    },
    their_strengths: [
      "Curated audience of early adopters looking for new products",
      "A well-established brand in the pre-launch space",
    ],
    our_edge: [
      "No queue and no paywall to be seen — launch this week, free",
      "A ranked weekly board plus a permanent, dofollow page",
      "Free directory tracker and tools included",
    ],
  },
  {
    slug: "peerlist",
    name: "Peerlist",
    compareTitle: "Peerlist",
    oneLiner:
      "A professional network with a weekly Launchpad. Great if you want your launch tied to your profile and network.",
    cells: {
      free: "yes",
      permanent: "yes",
      dofollow: "varies",
      weekly: "yes",
      browse: "yes",
      directory: "no",
      tools: "no",
    },
    their_strengths: [
      "Ties launches to real professional profiles and a network",
      "A weekly Launchpad with genuine engagement",
    ],
    our_edge: [
      "No account needed to browse or be discovered",
      "A guaranteed dofollow backlink and a permanent product page",
      "Directory-submission service and free founder tools on the side",
    ],
  },
  {
    slug: "uneed",
    name: "Uneed",
    compareTitle: "Uneed",
    oneLiner:
      "A daily product directory for makers. Solid dofollow links; the cadence is daily rather than a ranked weekly board.",
    cells: {
      free: "yes",
      permanent: "yes",
      dofollow: "yes",
      weekly: "no",
      browse: "yes",
      directory: "no",
      tools: "varies",
    },
    their_strengths: [
      "Founder-friendly with good dofollow backlinks",
      "Steady daily flow of new products",
    ],
    our_edge: [
      "A ranked weekly board makes it winnable and shareable",
      "Directory-submission service plus a free 120-directory tracker",
      "AI autofill writes your listing from just your URL",
    ],
  },
  {
    slug: "microlaunch",
    name: "MicroLaunch",
    compareTitle: "MicroLaunch",
    oneLiner:
      "A launch platform for indie makers with daily and weekly boards. Some placements and skips are paid.",
    cells: {
      free: "varies",
      permanent: "yes",
      dofollow: "varies",
      weekly: "yes",
      browse: "yes",
      directory: "no",
      tools: "no",
    },
    their_strengths: [
      "Active indie-maker community",
      "Daily and weekly visibility options",
    ],
    our_edge: [
      "Being on the board is always free — paid is only ever an upgrade",
      "A permanent dofollow page and a real weekly ranking",
      "Free tools and a done-for-you directory service",
    ],
  },
];

export function platformBySlug(slug: string): Platform | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}
