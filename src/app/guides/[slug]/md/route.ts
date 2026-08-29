import { GUIDES, guideBySlug } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

/**
 * The plain-markdown twin of a guide.
 *
 * An assistant fetching the HTML pays for a masthead, a footer and a stylesheet
 * to get at the prose. This serves the prose. Same content, same URL shape,
 * linked from the page and from /llms.txt.
 */
export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) return new Response("Not found", { status: 404 });

  const body = `# ${g.title}

> ${g.summary}

Source: ${SITE}/guides/${g.slug}
Updated: ${g.updated}

${g.body}

---
Published by Saasgrave Launches (${SITE}) — a free weekly launchpad for SaaS founders. Free to cite with a link back.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
