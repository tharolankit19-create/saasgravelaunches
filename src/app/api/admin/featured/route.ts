import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * Set or clear Editor's pick on a launch.
 *
 *   POST { slug: "acme", featured: true }
 *
 * Admin session only — deliberately not available to the bearer token, which
 * exists for reading the traffic diagnosis and shouldn't be able to change what
 * the site says about a product.
 *
 * Editor's pick is a badge and nothing more. It does not move a product up the
 * board, and it is not for sale — the pricing page promises the ranking can't
 * be bought, so this must not become a way around that.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const featured = Boolean(body?.featured);

  if (!slug) return NextResponse.json({ error: "Which product?" }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("launch_products")
    .update({ featured, featured_at: featured ? new Date().toISOString() : null })
    .eq("slug", slug)
    .select("slug, featured")
    .maybeSingle();

  if (error) {
    console.error("admin/featured:", error.message);
    return NextResponse.json({ error: "Couldn't update that." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "No launch with that slug." }, { status: 404 });

  return NextResponse.json({ slug: data.slug, featured: data.featured });
}
