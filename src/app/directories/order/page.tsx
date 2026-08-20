import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck, Clock, Zap } from "lucide-react";
import { Rubric } from "@/components/ui";
import { DirectoryOrderForm } from "@/components/directory-order-form";
import { TrackOnMount } from "@/components/tracker";
import { isOrderTier, type OrderTierKey } from "@/lib/directory-orders";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order a directory blast — no account, pay and we submit by hand",
  description:
    "Pay once and we submit your product to 70+ high-DR directories by hand. No signup. Fill three fields, pay, and watch your order live. Do-follow links only.",
  alternates: { canonical: `${SITE}/directories/order` },
};

const REASSURE = [
  { icon: <ShieldCheck className="h-4 w-4" />, text: "Do-follow links only" },
  { icon: <Zap className="h-4 w-4" />, text: "Hand-picked, high-DR" },
  { icon: <Clock className="h-4 w-4" />, text: "We start within 48h" },
];

export default function OrderPage({ searchParams }: { searchParams: { plan?: string } }) {
  const initialTier: OrderTierKey | undefined = isOrderTier(searchParams.plan)
    ? searchParams.plan
    : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <TrackOnMount event="directory_order_view" />

      <Link
        href="/directories"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600"
      >
        ← Directory service
      </Link>

      <Rubric className="mb-3 mt-5 max-w-sm">No account · pay & track live</Rubric>
      <h1 className="max-w-2xl font-serif text-display font-semibold text-ink-900">
        Order your directory blast
      </h1>
      <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-700">
        No signup, no password. Tell us the three things we need, pay through a secure link, and
        watch your order move — live — on your own tracking page. We do the 70 hours of copy-pasting.
      </p>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {REASSURE.map((r) => (
          <span
            key={r.text}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500"
          >
            <span className="text-moss-600">{r.icon}</span>
            {r.text}
          </span>
        ))}
      </div>

      <div className="mt-9">
        <DirectoryOrderForm initialTier={initialTier} />
      </div>

      {/* small print — honest */}
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-900/10 pt-6 text-[12px] text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-moss-500" /> Secure payment via Dodo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-moss-500" /> A full report with every live link
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-moss-500" /> Questions?{" "}
          <Link href="/directories" className="underline hover:text-ember-600">
            See how it works
          </Link>
        </span>
      </div>
    </div>
  );
}
