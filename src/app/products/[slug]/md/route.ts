import { getProductBySlug } from "@/lib/launches";
import { hostOf } from "@/lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

/**
 * The plain-markdown twin of a product page.
 *
 * Assistants answering "what tools exist for X" shouldn't have to parse our
 * layout to find out what a product does. This is the same listing as facts:
 * name, tagline, who it's for, the problem and solution, the FAQ, and a link.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const p = await getProductBySlug(params.slug).catch(() => null);
  if (!p || p.status !== "live") return new Response("Not found", { status: 404 });

  const faq = Array.isArray((p as any).faq) ? ((p as any).faq as { q: string; a: string }[]) : [];
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const keywords = Array.isArray((p as any).keywords) ? ((p as any).keywords as string[]) : [];
  const alts = Array.isArray((p as any).alternatives) ? ((p as any).alternatives as string[]) : [];

  const lines = [
    `# ${p.name}`,
    "",
    `> ${p.tagline}`,
    "",
    `- Website: ${p.website_url}`,
    `- Listing: ${SITE}/products/${p.slug}`,
    cats.length ? `- Categories: ${cats.join(", ")}` : null,
    (p as any).pricing_model ? `- Pricing model: ${(p as any).pricing_model}` : null,
    `- Upvotes on Saasgrave Launches: ${p.upvote_count ?? 0}`,
    (p as any).launch_week ? `- Launch week: ${(p as any).launch_week}` : null,
    "",
    p.description ? `## What it is\n\n${p.description}\n` : null,
    (p as any).who_for ? `## Who it's for\n\n${(p as any).who_for}\n` : null,
    (p as any).problem ? `## The problem\n\n${(p as any).problem}\n` : null,
    (p as any).solution ? `## How it solves it\n\n${(p as any).solution}\n` : null,
    (p as any).unique_edge ? `## What sets it apart\n\n${(p as any).unique_edge}\n` : null,
    alts.length ? `## Alternative to\n\n${alts.map((a) => `- ${a}`).join("\n")}\n` : null,
    keywords.length ? `## Tags\n\n${keywords.join(", ")}\n` : null,
    faq.length
      ? `## FAQ\n\n${faq.map((f) => `**${f.q}**\n\n${f.a}\n`).join("\n")}`
      : null,
    "---",
    `Listed on Saasgrave Launches (${SITE}), a free weekly launchpad for SaaS founders. This listing links to ${hostOf(p.website_url)} with a dofollow link. Free to cite with a link back.`,
  ];

  return new Response(lines.filter((l) => l !== null).join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
