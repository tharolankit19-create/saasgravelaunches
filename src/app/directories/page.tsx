import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, FileText, Link2, Sparkles } from "lucide-react";
import { Badge, Card, Rubric } from "@/components/ui";
import { DirectoryCustom } from "@/components/directory-custom";
import { TrackOnMount } from "@/components/tracker";
import { PRODUCTS, type ProductKey } from "@/lib/pricing";
import { type OrderTierKey } from "@/lib/directory-orders";
import { cn } from "@/lib/utils";

// The pricing catalogue and the no-login order tiers are the same three plans.
const ORDER_PLAN: Record<Extract<ProductKey, "directory" | "directoryPro" | "directoryMax">, OrderTierKey> = {
  directory: "starter49",
  directoryPro: "growth99",
  directoryMax: "premium149",
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit your product to 100+ directories — done by hand",
  description:
    "We manually submit your product to high-DR startup directories. Do-follow links only, hand-picked to your niche, full report. From $99. You're buying back the weekend.",
};

const TIERS = [
  { key: "directory" as const, save: "Save 20+ hours" },
  { key: "directoryPro" as const, save: "Save 45+ hours", popular: true },
  { key: "directoryMax" as const, save: "Save 70+ hours" },
];

const STEPS = [
  { n: "01", title: "Tell us your product", body: "Fill three quick fields — product, a handle, your email. No account." },
  { n: "02", title: "Pay securely", body: "Pick a tier and pay through a secure link. You get a private tracking page." },
  { n: "03", title: "We submit by hand", body: "We hand-pick high-DR directories in your niche and submit manually." },
  { n: "04", title: "Watch it live", body: "Track every submission on your page, then get a full report with every live link." },
];

export default function DirectoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <TrackOnMount event="directories_view" />

      {/* ── hero ── */}
      <Rubric className="mb-5 max-w-xs">Done-for-you service</Rubric>
      <h1 className="max-w-3xl font-serif text-display font-semibold text-ink-900">
        Submit your product to 100+ directories, by hand.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
        Submitting a product to 100+ directories by hand takes about 70 hours. We know — we do it for
        people. Do-follow links only, hand-picked to your niche, no bots. We start within 48 hours and
        send a full report with every submission. <strong>You&apos;re buying back the weekend.</strong> 🔥
      </p>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
        <span className="inline-flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Do-follow only</span>
        <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Hand-picked, high-DR</span>
        <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Full report</span>
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Starts in 48h · no launch needed</span>
      </div>

      {/* ── tiers ── */}
      <section id="tiers" className="mt-12 grid gap-4 md:grid-cols-3">
        {TIERS.map(({ key, save, popular }) => {
          const spec = PRODUCTS[key];
          return (
            <Card
              key={key}
              className={cn(
                "flex flex-col p-7",
                popular && "border-ember-500/45 bg-ember-500/[0.03] shadow-lift"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xl font-semibold text-ink-900">{spec.name}</h3>
                {popular && <Badge tone="orange">Most popular</Badge>}
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="figure text-4xl font-semibold text-ink-900">${spec.dollars}</span>
                <span className="text-[13px] text-ink-400">one-off</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-moss-600">{save}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{spec.tagline}</p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {spec.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[13px] text-ink-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href={`/directories/order?plan=${ORDER_PLAN[key]}`}
                className={cn(
                  "mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-medium transition",
                  popular
                    ? "bg-ember-500 text-paper-100 hover:bg-ember-600"
                    : "bg-ink-900 text-paper-100 hover:bg-ember-500"
                )}
              >
                Get {spec.name} — ${spec.dollars}
              </Link>
              <p className="mt-2 text-center text-[11px] text-ink-400">Pay &amp; track — no account</p>
            </Card>
          );
        })}
      </section>

      {/* ── custom (below the fixed tiers) ── */}
      <section className="mt-8">
        <DirectoryCustom />
      </section>

      {/* ── trust row ── */}
      <section className="mt-14 grid grid-cols-2 gap-6 border-y border-ink-900/12 py-8 sm:grid-cols-4">
        {[
          ["120+", "Directories on tap"],
          ["Do-follow", "Links only"],
          ["48h", "We start within"],
          ["7–14d", "Full report back"],
        ].map(([v, l]) => (
          <div key={l}>
            <div className="figure text-2xl font-semibold text-ink-900">{v}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">{l}</div>
          </div>
        ))}
      </section>

      {/* ── how it works ── */}
      <section className="mt-14">
        <Rubric className="mb-6">How it works</Rubric>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-6">
              <p className="font-mono text-[11px] text-ember-600">{s.n}</p>
              <h3 className="mt-2 font-serif text-lg font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── close ── */}
      <section className="mt-14 border-t border-ink-900/12 pt-10 text-center">
        <h2 className="font-serif text-masthead font-semibold text-ink-900">
          Submit once. We do the rest.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
          Skip 50+ hours of copy-pasting the same form. Real report, real do-follow links, real DR.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#tiers"
            className="inline-flex items-center rounded-lg bg-ink-900 px-6 py-3 text-[15px] font-medium text-paper-100 transition hover:bg-ember-500"
          >
            See the plans
          </a>
          <Link
            href="/launch"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 underline decoration-ink-900/25 underline-offset-4 hover:text-ember-600"
          >
            or launch free first
          </Link>
        </div>
      </section>
    </div>
  );
}
