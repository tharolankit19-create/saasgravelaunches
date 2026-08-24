import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { Rubric } from "@/components/ui";
import { ComparisonTable } from "@/components/comparison-table";
import { PLATFORMS, platformBySlug } from "@/lib/compare";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export function generateStaticParams() {
  return PLATFORMS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = platformBySlug(params.slug);
  if (!p) return {};
  return {
    title: `Saasgrave Launches vs ${p.name} — the honest comparison (2026)`,
    description: `Looking for a ${p.name} alternative? Here's an honest, side-by-side comparison with Saasgrave Launches — free launch, permanent page, dofollow backlink, weekly board.`,
    alternates: { canonical: `${SITE}/alternatives/${p.slug}` },
  };
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const p = platformBySlug(params.slug);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link
        href="/alternatives"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600"
      >
        ← All alternatives
      </Link>

      <Rubric className="mb-3 mt-5 max-w-xs">Honest comparison</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">
        Saasgrave Launches vs {p.name}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">{p.oneLiner}</p>

      <div className="mt-10">
        <ComparisonTable others={[p]} />
        <p className="mt-3 text-[12px] text-ink-400">
          Compiled from public information in 2026 — verify the latest on {p.name}.
        </p>
      </div>

      {/* strengths / edge */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-900/10 bg-paper-100 p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Where {p.name} is strong</h2>
          <ul className="mt-4 space-y-2.5">
            {(p.their_strengths || []).map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-[13.5px] text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-ember-500/25 bg-ember-500/[0.03] p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900">
            Where Saasgrave Launches wins
          </h2>
          <ul className="mt-4 space-y-2.5">
            {(p.our_edge || []).map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-[13.5px] text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* which to pick */}
      <div className="mt-12 rounded-2xl border border-ink-900/10 bg-paper-100 p-7">
        <h2 className="font-serif text-section font-semibold text-ink-900">Which should you use?</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Honestly? Use both. Launch on {p.name} for the reach, and launch on Saasgrave Launches the
          same week for the permanent page and the dofollow backlink that keeps working long after
          launch day. They&apos;re not mutually exclusive — the more quality places you launch, the
          more compounding SEO you build.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/launch"
            className="inline-flex items-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-[15px] font-medium text-paper-100 transition hover:bg-ember-600"
          >
            Launch on Saasgrave free →
          </Link>
          <Link
            href="/free-directories"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 underline decoration-ink-900/25 underline-offset-4 hover:text-ember-600"
          >
            or grab the free 120-directory tracker
          </Link>
        </div>
      </div>

      {/* other comparisons */}
      <div className="mt-12">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
          More comparisons
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.filter((o) => o.slug !== p.slug).map((o) => (
            <Link
              key={o.slug}
              href={`/alternatives/${o.slug}`}
              className="rounded-full border border-ink-900/12 px-3.5 py-1.5 text-[12px] text-ink-600 transition hover:border-ember-500 hover:text-ember-600"
            >
              vs {o.name}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-8 flex items-center gap-1.5 text-[12px] text-ink-400">
        <X className="h-3 w-3" /> No paid placement in this comparison — we launch on these boards too.
      </p>
    </div>
  );
}
