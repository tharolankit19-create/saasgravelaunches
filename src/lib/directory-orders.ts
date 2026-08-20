// ─── The no-login directory-blast order ─────────────────────
// Some buyers don't want an account. They want to pay, tell us the two or
// three things we actually need, and watch the work happen. This is the whole
// contract for that flow: the tiers you can buy, the hosted Dodo link each one
// pays through, and the status pipeline the buyer follows afterwards.
//
// Everything here is public — a hosted checkout URL is not a secret. The one
// thing that IS private is the per-order token, which is generated server-side
// and is the only key to a buyer's status page.

export type OrderTierKey = "growth99" | "starter49" | "premium149";

export type OrderTier = {
  key: OrderTierKey;
  name: string;
  dollars: number;
  directories: string;
  blurb: string;
  /** The Dodo hosted payment link this tier checks out through. Public URL. */
  paymentLink: string;
  /** Optional env override, so the link can be rotated without a deploy. */
  envKey: string;
};

// The $99 / 70+ tier is live now, with the hosted link the operator provided.
// The other two reuse the same product page until their own links exist — set
// DODO_DIRECTORY_LINK_49 / _149 in the environment to split them out.
const LINK_99 = "https://checkout.dodopayments.com/buy/pdt_0NlJgRSur9vc7m2mZ0cOJ?quantity=1";

export const ORDER_TIERS: Record<OrderTierKey, OrderTier> = {
  starter49: {
    key: "starter49",
    name: "Starter",
    dollars: 49,
    directories: "30+ directories",
    blurb: "30 hand-picked, high-DR directories. Do-follow only.",
    paymentLink: LINK_99,
    envKey: "DODO_DIRECTORY_LINK_49",
  },
  growth99: {
    key: "growth99",
    name: "Growth",
    dollars: 99,
    directories: "70+ directories",
    blurb: "70 hand-picked, high-DR directories, submitted by hand. Do-follow only.",
    paymentLink: LINK_99,
    envKey: "DODO_DIRECTORY_LINK_99",
  },
  premium149: {
    key: "premium149",
    name: "Premium",
    dollars: 149,
    directories: "100+ directories",
    blurb: "100+ of the highest-DR directories, hand-picked to your niche.",
    paymentLink: LINK_99,
    envKey: "DODO_DIRECTORY_LINK_149",
  },
};

export const ORDER_TIER_ORDER: OrderTierKey[] = ["starter49", "growth99", "premium149"];

/** The tier a buyer lands on by default — the one the operator set up first. */
export const DEFAULT_TIER: OrderTierKey = "growth99";

export function isOrderTier(v: unknown): v is OrderTierKey {
  return typeof v === "string" && v in ORDER_TIERS;
}

/** The live payment link for a tier, honouring an env override. */
export function paymentLinkFor(key: OrderTierKey): string {
  const override = process.env[ORDER_TIERS[key].envKey]?.trim();
  return override || ORDER_TIERS[key].paymentLink;
}

// ─── The status pipeline the buyer watches ──────────────────
// Kept deliberately short and honest. `admin_notes` carries the live, human
// "what's happening right now" line on top of whichever step is current.

export type OrderStatus =
  | "received"
  | "paid"
  | "in_progress"
  | "completed"
  | "on_hold";

export const ORDER_STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  desc: string;
}[] = [
  { key: "received", label: "Order received", desc: "We've got your details. Confirming your payment." },
  { key: "paid", label: "Payment confirmed", desc: "You're in the queue. We'll start submitting shortly." },
  { key: "in_progress", label: "Submitting", desc: "We're submitting your product to directories by hand." },
  { key: "completed", label: "Completed", desc: "All submissions done. Your report is ready." },
];

/** The four steps that form the visible track (on_hold is drawn separately). */
export const PIPELINE: OrderStatus[] = ["received", "paid", "in_progress", "completed"];

export function statusMeta(status: string) {
  return (
    ORDER_STATUS_STEPS.find((s) => s.key === status) || {
      key: "received" as OrderStatus,
      label: "Order received",
      desc: "We've got your details.",
    }
  );
}

/** 0–1 progress along the pipeline, for the buyer's bar. */
export function pipelineProgress(status: string): number {
  const i = PIPELINE.indexOf(status as OrderStatus);
  if (status === "on_hold") return 0.15;
  if (i < 0) return 0;
  return i / (PIPELINE.length - 1);
}

/** A URL-safe random token, the buyer's only key to their status page. */
export function newOrderToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Normalise an X/Twitter handle to a bare @handle, or "" if empty. */
export function cleanXHandle(v: string): string {
  const t = v.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i, "").replace(/[/?].*$/, "");
  return t ? `@${t}` : "";
}
