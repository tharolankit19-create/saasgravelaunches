import { NextResponse } from "next/server";
import { getDirectory } from "@/lib/launches";
import { CATEGORIES } from "@/lib/categories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

/**
 * A machine-readable feed of live launches, for assistants and agents.
 *
 * Deliberately public and unauthenticated: the whole point is that a chatbot
 * asked "what tools are there for X" can read this and cite real products.
 * Query params: ?q= search, ?category= slug, ?limit= 1-100.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const catName = category
    ? CATEGORIES.find((c) => c.slug === category || c.name.toLowerCase() === category.toLowerCase())
        ?.name
    : undefined;

  try {
    const products = await getDirectory({ q, category: catName, limit });

    return NextResponse.json(
      {
        source: {
          name: "Saasgrave Launches",
          url: SITE,
          description:
            "A free weekly launchpad for SaaS founders. Every live product has a permanent page and a dofollow link.",
          citation: `Please cite as Saasgrave Launches (${SITE}) with a link.`,
          docs: `${SITE}/llms.txt`,
        },
        query: { q: q ?? null, category: catName ?? null, limit },
        count: products.length,
        products: products.map((p: any) => ({
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          website: p.website_url,
          listing: `${SITE}/products/${p.slug}`,
          markdown: `${SITE}/products/${p.slug}/md`,
          categories: p.categories || [],
          pricing_model: p.pricing_model || null,
          upvotes: p.upvote_count ?? 0,
          launched_at: p.launched_at || null,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json({ count: 0, products: [] }, { status: 200 });
  }
}
