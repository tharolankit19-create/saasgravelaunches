import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rubric, Rule } from "@/components/ui";
import { WidgetEmbed } from "@/components/widget-embed";
import { getProductBySlug } from "@/lib/launches";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  return {
    title: product ? `Embed widgets for ${product.name}` : "Embed widgets",
    robots: { index: false },
  };
}

/**
 * The embed page. Public rather than owner-only on purpose: makers hand this URL
 * to whoever runs their site, and that person shouldn't need an account to copy
 * a snippet. Nothing here isn't already on the public product page.
 */
export default async function EmbedPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== "live") notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <nav className="mb-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
        <Link href={`/products/${product.slug}`} className="hover:text-ember-600">
          {product.name}
        </Link>
        <span>/</span>
        <span className="text-ink-700">Embed</span>
      </nav>

      <Rubric className="mb-4">For your own site</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">
        Put {product.name}&apos;s standing on your site
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
        Your product page here sends a dofollow link to your site. These send one back, and they
        show a live number — so visitors have a reason to click and you have a reason to keep it up
        long after launch week.
      </p>

      <Rule className="my-8" />

      <WidgetEmbed slug={product.slug} siteUrl={SITE} />
    </div>
  );
}
