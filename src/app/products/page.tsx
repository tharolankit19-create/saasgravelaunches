import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, Rubric, Empty, LinkButton, inputClass } from "@/components/ui";
import { ProductRow } from "@/components/product-row";
import { AdRail } from "@/components/ad-rail";
import { currentUser } from "@/lib/supabase/server";
import { getDirectory, getMyUpvotes } from "@/lib/launches";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product directory — every SaaS launched here",
  description:
    "Browse every product launched on Saasgrave Launches, ranked by real upvotes. Filter by category, find your next tool, or launch your own for free.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const [products, user] = await Promise.all([getDirectory({ q: q || undefined }), currentUser()]);
  const myUpvotes = await getMyUpvotes(products.map((p) => p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Rubric className="mb-3">Directory</Rubric>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        Every product launched here
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500">
        Ranked by upvotes, all time. Every one of these has a permanent page and a dofollow link —
        which is exactly what yours gets when you launch.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <form action="/products" className="relative mb-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search products…"
              className={cn(inputClass, "pl-10")}
            />
          </form>

          <div className="mb-5 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="rounded-full border border-ink-900/10 bg-paper-100 px-3 py-1.5 text-[13px] font-medium text-ink-500 transition hover:border-ember-500/40 hover:text-ember-600"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <Empty
              title={q ? `Nothing matches “${q}”` : "No products yet"}
              sub={q ? "Try a shorter search, or browse by category." : "The first launch could be yours."}
              action={<LinkButton href="/launch">Launch a product</LinkButton>}
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
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdRail />
        </aside>
      </div>
    </div>
  );
}
<a href="https://nicklaunches.com/products/saasgrave-launches/?utm_source=ls.saasgrave.org&utm_medium=badge&utm_campaign=featured" target="_blank" rel="noopener"><img src="https://nicklaunches.com/badges/featured.png" alt="Saasgrave Launches on Nick Launches" width="244" height="56" /></a>
