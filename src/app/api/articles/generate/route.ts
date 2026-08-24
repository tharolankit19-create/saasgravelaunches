import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { generateArticle, slugify } from "@/lib/articles";
import { normalizeUrl } from "@/lib/planets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Generate and publish a Premium+ article for a product. Admin-only — this is
 * the operator fulfilling a Premium+ purchase, and an open AI-writing endpoint
 * would just get abused. Returns the published slug + URL.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const productName = String(body?.productName || "").trim().slice(0, 80);
  const productUrl = normalizeUrl(String(body?.productUrl || ""));
  const tagline = String(body?.tagline || "").trim().slice(0, 200) || undefined;
  const category = String(body?.category || "").trim().slice(0, 60) || undefined;
  const productSlug = String(body?.productSlug || "").trim().slice(0, 120) || null;

  if (!productName || !productUrl) {
    return NextResponse.json({ error: "Product name and a valid URL are required." }, { status: 400 });
  }

  const article = await generateArticle({ productName, productUrl, tagline, category });

  const admin = createAdminClient();
  // Unique slug — append a short suffix if taken.
  const base = slugify(article.title) || slugify(productName) || "article";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin
      .from("launch_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = await admin.from("launch_articles").insert({
    slug,
    title: article.title,
    subtitle: article.subtitle,
    body_md: article.body_md,
    product_name: productName,
    product_url: productUrl,
    product_slug: productSlug,
    status: "published",
  });

  if (error) {
    return NextResponse.json({ error: "Couldn't save the article.", code: error.code }, { status: 500 });
  }

  return NextResponse.json({ slug, url: `/blog/${slug}` });
}
