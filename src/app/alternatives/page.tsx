import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Rubric, Card } from "@/components/ui";
import { ComparisonTable } from "@/components/comparison-table";
import { PLATFORMS } from "@/lib/compare";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Best places to launch your SaaS in 2026 — compared",
  description:
    "An honest comparison of the best places to launch your SaaS: Product Hunt, BetaList, Peerlist, Uneed and more — free vs paid, dofollow vs nofollow, weekly boards and permanent pages.",
  alternates: { canonical: `${SITE}/alternatives` },
};

const WHY = [
  "Free to launch — being on the board is never paywalled",
  "A permanent product page with a real dofollow backlink",
  "A weekly board of ~20 that's actually winnable",
  "AI writes your listing from just your URL",
  "A free 120-directory tracker and founder tools on the side",
];

export default function AlternativesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best places to launch your SaaS",
    itemListElement: PLATFORMS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE}/alternatives/${p.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Rubric className="mb-3 max-w-xs">Honest comparison</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">
        The best places to launch your SaaS
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
        Every launch platform sells the same thing — eyeballs on launch day. The ones worth your time
        also leave you something durable: a page that keeps ranking and a backlink that passes SEO
        value. Here&apos;s how the main options actually compare.
      </p>

      <div className="mt-10">
        <ComparisonTable others={PLATFORMS} />
        <p className="mt-3 text-[12px] text-ink-400">
          Compiled from public information in 2026. Details change — verify the latest on each
          platform. &ldquo;Varies&rdquo; means it depends on plan, placement or isn&apos;t clearly
          public.
        </p>
      </div>

      {/* per-platform links */}
      <h2 className="mt-14 font-serif text-section font-semibold text-ink-900">
        Compare us to a specific platform
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <Link key={p.slug} href={`/alternatives/${p.slug}`} className="group">
            <Card className="flex items-center justify-between gap-3 p-4 transition hover:shadow-lift">
              <div>
                <p className="text-[15px] font-semibold text-ink-900 group-hover:text-ember-600">
                  Saasgrave Launches vs {p.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-500">{p.oneLiner}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 group-hover:text-ember-600" />
            </Card>
          </Link>
        ))}
      </div>

      {/* why us */}
      <div className="mt-14 rounded-2xl border border-ink-900/10 bg-paper-100 p-7">
        <Rubric className="mb-4 max-w-xs">Why Saasgrave Launches</Rubric>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {WHY.map((w) => (
            <li key={w} className="flex items-start gap-2.5 text-[14px] text-ink-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
              {w}
            </li>
          ))}
        </ul>
        <Link
          href="/launch"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-[15px] font-medium text-paper-100 transition hover:bg-ember-600"
        >
          Launch yours free →
        </Link>
      </div>
    </div>
  );
}
