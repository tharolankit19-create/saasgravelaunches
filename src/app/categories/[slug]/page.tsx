import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Rubric, Empty, LinkButton } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { AdRail } from "@/components/ad-rail";
import { currentUser } from "@/lib/supabase/server";
import { getDirectory, getMyUpvotes } from "@/lib/launches";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = categoryBySlug(params.slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `Best ${category.name} products, launched by makers`,
    description: `${category.blurb} Every ${category.name} product launched on Saasgrave Launches, ranked by real upvotes.`,
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categoryBySlug(params.slug);
  if (!category) notFound();

  const [products, user] = await Promise.all([
    getDirectory({ category: category.name }),
    currentUser(),
  ]);
  const myUpvotes = await getMyUpvotes(products.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-ink-400">
        <Link href="/products" className="hover:text-ember-600">
          Directory
        </Link>
        <span>/</span>
        <span className="text-ink-700">{category.name}</span>
      </nav>

      <Rubric className="mb-3">Category</Rubric>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">{category.blurb}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {products.length === 0 ? (
            <Empty
              title={`No ${category.name} products yet`}
              sub="This category is wide open — first launch owns the page."
              action={<LinkButton href="/launch">Launch here first</LinkButton>}
            />
          ) : (
            <Card className="overflow-hidden">
              {products.map((p, i) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  index={i}
                  upvoted={myUpvotes.has(p.id)}
                  signedIn={Boolean(user)}
                />
              ))}
            </Card>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="rounded-full border border-ink-900/10 bg-paper-100 px-3 py-1.5 text-[13px] font-medium text-ink-500 transition hover:border-ember-500/40 hover:text-ember-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdRail />
        </aside>
      </div>
    </div>
  );
}
