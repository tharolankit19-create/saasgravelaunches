import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The embeddable badge — an SVG served to a maker's own website.
 *
 *   GET /api/badge?slug=acme&theme=light|dark
 *
 * This is the compounding half of a launch: the product page links out to the
 * maker, and the badge links back. It's rendered as SVG rather than a PNG so
 * it stays sharp anywhere and costs nothing to serve, and it's cached at the
 * edge because the only thing that changes is the upvote count.
 *
 * Deliberately public and unauthenticated — it's an image on someone else's
 * site. It exposes nothing that isn't already on the public product page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").slice(0, 80);
  const dark = searchParams.get("theme") === "dark";

  let name = "Saasgrave Launches";
  let upvotes: number | null = null;
  let rank: number | null = null;

  if (slug) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("launch_products")
        .select("name, upvote_count, launch_week, status")
        .eq("slug", slug)
        .eq("status", "live")
        .maybeSingle();

      if (data) {
        name = data.name;
        upvotes = data.upvote_count ?? 0;

        // Where it placed in its own week — a badge that says "#2 this week"
        // is worth far more to a maker than one that just says "listed".
        if (data.launch_week) {
          const { data: week } = await admin
            .from("launch_products")
            .select("slug, upvote_count")
            .eq("status", "live")
            .eq("launch_week", data.launch_week)
            .order("upvote_count", { ascending: false })
            .order("launched_at", { ascending: true })
            .limit(200);
          const idx = (week || []).findIndex((p: any) => p.slug === slug);
          if (idx !== -1) rank = idx + 1;
        }
      }
    } catch {
      // Fall through to the generic badge — never serve a broken image.
    }
  }

  const svg = renderBadge({ rank, upvotes, dark });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Short public cache: the count moves, but not every second, and this is
      // served from other people's pages so it must not hammer the database.
      "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=86400",
    },
  });
}

function renderBadge({
  rank,
  upvotes,
  dark,
}: {
  rank: number | null;
  upvotes: number | null;
  dark: boolean;
}) {
  const bg = dark ? "#12110f" : "#ffffff";
  const border = dark ? "#2b2823" : "#e8e5dd";
  const label = dark ? "#948e80" : "#6a655a";
  const strong = dark ? "#ffffff" : "#12110f";

  const top = rank ? `#${rank} LAUNCH OF THE WEEK` : "FEATURED ON";
  const votes = upvotes == null ? "" : String(upvotes);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="54" viewBox="0 0 250 54" role="img" aria-label="Featured on Saasgrave Launches">
  <title>Featured on Saasgrave Launches</title>
  <rect x="0.5" y="0.5" width="249" height="53" rx="11" fill="${bg}" stroke="${border}"/>
  <rect x="12" y="14" width="26" height="26" rx="7.5" fill="#f2671e"/>
  <path d="M19 33 L25 24 L31 33" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M21 37 h8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
  <text x="47" y="23" font-family="Verdana,DejaVu Sans,sans-serif" font-size="8" letter-spacing="0.7" fill="${label}">${escapeXml(top)}</text>
  <text x="47" y="39" font-family="Verdana,DejaVu Sans,sans-serif" font-size="13" font-weight="bold" fill="${strong}">Saasgrave Launches</text>
  ${
    votes
      ? `<g transform="translate(212,15)">
    <rect x="0" y="0" width="26" height="24" rx="7" fill="${dark ? "#3a1e10" : "#fdece2"}"/>
    <path d="M13 7 L17 12 H9 Z" fill="#f2671e"/>
    <text x="13" y="21" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="9" font-weight="bold" fill="${strong}">${escapeXml(votes)}</text>
  </g>`
      : ""
  }
</svg>`;
}

/** The name and count come from user data, so they get escaped into the SVG. */
function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
