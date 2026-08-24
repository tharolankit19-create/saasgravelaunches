import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Rubric } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/markdown";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("launch_articles")
      .select("slug, title, subtitle, body_md, product_name, product_url, created_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.subtitle || undefined,
    alternates: { canonical: `${SITE}/blog/${a.slug}` },
    openGraph: { title: a.title, description: a.subtitle || undefined, type: "article" },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug);
  if (!a) notFound();

  const html = renderMarkdown(a.body_md);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.subtitle,
    datePublished: a.created_at,
    author: { "@type": "Organization", name: "Saasgrave Launches" },
    publisher: { "@type": "Organization", name: "Saasgrave Launches" },
    mainEntityOfPage: `${SITE}/blog/${a.slug}`,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
        ← Articles
      </Link>
      <Rubric className="mb-3 mt-5 max-w-xs">Article</Rubric>
      <h1 className="font-serif text-display font-semibold leading-[1.05] text-ink-900">{a.title}</h1>
      {a.subtitle && <p className="mt-4 text-lg leading-relaxed text-ink-600">{a.subtitle}</p>}

      <div className="prose-register mt-10" dangerouslySetInnerHTML={{ __html: html }} />

      {a.product_url && (
        <a
          href={a.product_url}
          target="_blank"
          rel="noopener"
          className="mt-12 flex items-center justify-between gap-3 rounded-2xl border border-ember-500/25 bg-ember-500/[0.03] p-5 transition hover:border-ember-500/50"
        >
          <div>
            <p className="text-[14px] font-semibold text-ink-900">
              Visit {a.product_name || "the product"}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-500">{a.product_url}</p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-ember-500" />
        </a>
      )}

      <div className="mt-8 border-t border-ink-900/10 pt-6 text-[13px] text-ink-500">
        Published on{" "}
        <Link href="/" className="text-ink-700 hover:text-ember-600">
          Saasgrave Launches
        </Link>
        . Want a page like this for your product?{" "}
        <Link href="/pricing" className="text-ember-600 hover:underline">
          See Premium+ →
        </Link>
      </div>
    </article>
  );
}
