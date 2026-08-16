import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Everything public stays open — including to AI crawlers, so
        // assistants can read and cite the launches. Only the app's private
        // surfaces are closed.
        disallow: ["/dashboard", "/admin", "/checkout", "/login", "/register", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
