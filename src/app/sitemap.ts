import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/leaderboard`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/launch`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE}/categories/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  // Product pages are the point of the site's SEO, so they all go in. Read
  // through the service role: the sitemap is built without a session, and the
  // anon client would only ever see what RLS allows a stranger to see.
  try {
    const { data } = await createAdminClient()
      .from("launch_products")
      .select("slug, updated_at")
      .eq("status", "live")
      .order("updated_at", { ascending: false })
      .limit(5000);

    return [
      ...staticPages,
      ...(data || []).map((p: any) => ({
        url: `${SITE}/products/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
