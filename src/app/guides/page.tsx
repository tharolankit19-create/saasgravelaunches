import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Rubric, Card } from "@/components/ui";
import { GUIDES } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const metadata: Metadata = {
  title: "Guides for founders — launching, directories, backlinks, first users",
  description:
    "Practical, no-filler guides for solo founders: how to launch a SaaS, which startup directories are worth it, dofollow vs nofollow backlinks, and getting your first 100 users.",
  alternates: { canonical: `${SITE}/guides` },
};

export default function GuidesIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Founder guides",
    itemListElement: GUIDES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${SITE}/guides/${g.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Rubric className="mb-3 max-w-xs">Guides</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">
        Guides for founders who ship
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
        The things we get asked constantly, written out properly. No filler, no invented statistics,
        and useful even if you never launch with us.
      </p>

      <div className="mt-10 space-y-3">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="group block">
            <Card className="flex items-start justify-between gap-4 p-5 transition hover:shadow-lift">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink-900 group-hover:text-ember-600">
                  {g.title}
                </h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">{g.summary}</p>
                <p className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  <Clock className="h-3 w-3" /> {g.minutes} min read
                </p>
              </div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-400 group-hover:text-ember-600" />
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-ink-900/10 bg-paper-100 p-6 text-center">
        <p className="text-[15px] text-ink-700">
          Ready to put a page up?{" "}
          <Link href="/launch" className="font-semibold text-ember-600 hover:underline">
            Launching is free and takes a minute →
          </Link>
        </p>
      </div>
    </div>
  );
}
