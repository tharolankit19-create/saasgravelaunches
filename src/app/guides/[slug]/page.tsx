import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, FileText } from "lucide-react";
import { Rubric } from "@/components/ui";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { renderMarkdown } from "@/lib/markdown";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.summary,
    keywords: g.keywords,
    alternates: { canonical: `${SITE}/guides/${g.slug}` },
    openGraph: { title: g.title, description: g.summary, type: "article" },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) notFound();

  const html = renderMarkdown(g.body);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.summary,
    dateModified: g.updated,
    author: { "@type": "Organization", name: "Saasgrave Launches", url: SITE },
    publisher: { "@type": "Organization", name: "Saasgrave Launches", url: SITE },
    mainEntityOfPage: `${SITE}/guides/${g.slug}`,
    keywords: g.keywords.join(", "),
  };

  const others = GUIDES.filter((o) => o.slug !== g.slug);

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/guides"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600"
      >
        ← All guides
      </Link>

      <Rubric className="mb-3 mt-5 max-w-xs">Guide</Rubric>
      <h1 className="font-serif text-display font-semibold leading-[1.06] text-ink-900">{g.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">{g.summary}</p>
      <p className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
        <Clock className="h-3 w-3" /> {g.minutes} min read · updated{" "}
        {new Date(g.updated).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </p>

      <div className="prose-register mt-9" dangerouslySetInnerHTML={{ __html: html }} />

      {/* markdown twin, for agents and for anyone who prefers it */}
      <a
        href={`/guides/${g.slug}/md`}
        className="mt-10 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600"
      >
        <FileText className="h-3 w-3" /> Read as plain markdown
      </a>

      <div className="mt-10 rounded-2xl border border-ember-500/25 bg-ember-500/[0.03] p-6">
        <p className="font-serif text-lg font-semibold text-ink-900">Put your product on the board</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
          Free, about a minute, and you keep the page and the dofollow link.
        </p>
        <Link
          href="/launch"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ember-500 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-ember-600"
        >
          Launch free →
        </Link>
      </div>

      <div className="mt-10 border-t border-ink-900/10 pt-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
          Keep reading
        </p>
        <ul className="space-y-2">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/guides/${o.slug}`}
                className="text-[14px] font-medium text-ink-700 hover:text-ember-600"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
