import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live embed widgets — SVG served onto a maker's own site.
 *
 *   GET /api/widget?slug=acme&kind=badge|upvote|rank&theme=light|dark
 *
 * These are the viral loop: our product page sends a dofollow link out, the
 * widget links back, and it shows a live number so the maker has a reason to
 * keep it up. SVG rather than an iframe or a script, because a directory has no
 * business running JavaScript on somebody else's page.
 *
 * Public and unauthenticated by necessity — it's an image on a third-party
 * site — and it exposes nothing that isn't already on the public product page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "").slice(0, 80);
  const kind = (searchParams.get("kind") || "badge").toLowerCase();
  const dark = searchParams.get("theme") === "dark";

  let upvotes: number | null = null;
  let rank: number | null = null;

  if (slug) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("launch_products")
        .select("upvote_count, launch_week, status")
        .eq("slug", slug)
        .eq("status", "live")
        .maybeSingle();

      if (data) {
        upvotes = data.upvote_count ?? 0;
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
      // Fall through to the generic form — never serve a broken image.
    }
  }

  const svg =
    kind === "upvote"
      ? upvoteWidget({ upvotes, dark })
      : kind === "rank"
        ? rankWidget({ rank, upvotes, dark })
        : badgeWidget({ rank, upvotes, dark });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Short cache: the number moves, but this is served from other people's
      // pages and must not hammer the database.
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

// ─── the three widgets ──────────────────────────────────────

type Palette = { bg: string; border: string; label: string; strong: string; well: string };

function palette(dark: boolean): Palette {
  return dark
    ? { bg: "#17150f", border: "#302c22", label: "#938d7e", strong: "#fffdf9", well: "#221f18" }
    : { bg: "#fffdf9", border: "#e2ded4", label: "#6b6659", strong: "#17150f", well: "#f6f4ef" };
}

const MARK = (x: number, y: number) => `
  <rect x="${x}" y="${y}" width="26" height="26" rx="4" fill="#f2671e"/>
  <path d="M${x + 7} ${y + 19} L${x + 13} ${y + 9} L${x + 19} ${y + 19}" stroke="#fffdf9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M${x + 9} ${y + 22} h8" stroke="#fffdf9" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/>`;

const FONT = "ui-monospace,SFMono-Regular,Menlo,DejaVu Sans Mono,monospace";
const SERIF = "Georgia,'Times New Roman',serif";

/** The wide "featured on" badge. */
function badgeWidget({
  rank,
  upvotes,
  dark,
}: {
  rank: number | null;
  upvotes: number | null;
  dark: boolean;
}) {
  const p = palette(dark);
  const top = rank ? `NO. ${rank} THIS WEEK` : "LISTED ON";
  const votes = upvotes == null ? "" : String(upvotes);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="248" height="56" viewBox="0 0 248 56" role="img" aria-label="Listed on Saasgrave Launches">
  <title>Saasgrave Launches</title>
  <rect x="0.5" y="0.5" width="247" height="55" rx="4" fill="${p.bg}" stroke="${p.border}"/>
  <rect x="0.5" y="0.5" width="247" height="2.5" fill="#f2671e"/>
  ${MARK(13, 15)}
  <text x="49" y="25" font-family="${FONT}" font-size="7.5" letter-spacing="1.1" fill="${p.label}">${esc(top)}</text>
  <text x="49" y="41" font-family="${SERIF}" font-size="14.5" font-weight="bold" fill="${p.strong}">Saasgrave Launches</text>
  ${
    votes
      ? `<g transform="translate(207,15)">
    <rect x="0" y="0" width="28" height="26" rx="3" fill="${p.well}" stroke="${p.border}"/>
    <path d="M14 7 L18.5 12.5 H9.5 Z" fill="#f2671e"/>
    <text x="14" y="22" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="bold" fill="${p.strong}">${esc(votes)}</text>
  </g>`
      : ""
  }
</svg>`;
}

/** A tall live upvote counter — the "vote for us" chip. */
function upvoteWidget({ upvotes, dark }: { upvotes: number | null; dark: boolean }) {
  const p = palette(dark);
  const votes = upvotes == null ? "–" : String(upvotes);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="58" viewBox="0 0 150 58" role="img" aria-label="Upvote on Saasgrave Launches">
  <title>Upvote on Saasgrave Launches</title>
  <rect x="0.5" y="0.5" width="149" height="57" rx="4" fill="${p.bg}" stroke="${p.border}"/>
  <rect x="0.5" y="0.5" width="149" height="2.5" fill="#f2671e"/>
  <text x="14" y="26" font-family="${FONT}" font-size="7.5" letter-spacing="1.1" fill="${p.label}">UPVOTE US ON</text>
  <text x="14" y="42" font-family="${SERIF}" font-size="12.5" font-weight="bold" fill="${p.strong}">Launches</text>
  <g transform="translate(101,13)">
    <rect x="0" y="0" width="35" height="32" rx="3" fill="${p.well}" stroke="${p.border}"/>
    <path d="M17.5 7 L23 13.5 H12 Z" fill="#f2671e"/>
    <text x="17.5" y="27" text-anchor="middle" font-family="${FONT}" font-size="10.5" font-weight="bold" fill="${p.strong}">${esc(votes)}</text>
  </g>
</svg>`;
}

/** A compact rank chip — only meaningful once the product has placed. */
function rankWidget({
  rank,
  upvotes,
  dark,
}: {
  rank: number | null;
  upvotes: number | null;
  dark: boolean;
}) {
  const p = palette(dark);
  const medal = rank === 1 ? "#b08a3e" : rank === 2 ? "#938d7e" : rank === 3 ? "#fb8b3d" : "#f2671e";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="48" viewBox="0 0 176 48" role="img" aria-label="Rank on Saasgrave Launches">
  <title>Rank on Saasgrave Launches</title>
  <rect x="0.5" y="0.5" width="175" height="47" rx="4" fill="${p.bg}" stroke="${p.border}"/>
  <rect x="0.5" y="0.5" width="3" height="47" fill="${medal}"/>
  <text x="16" y="20" font-family="${FONT}" font-size="7.5" letter-spacing="1.1" fill="${p.label}">THIS WEEK ON LAUNCHES</text>
  <text x="16" y="37" font-family="${SERIF}" font-size="15" font-weight="bold" fill="${p.strong}">${
    rank ? `No. ${esc(String(rank))}` : "Listed"
  }</text>
  ${
    upvotes == null
      ? ""
      : `<text x="164" y="37" text-anchor="end" font-family="${FONT}" font-size="10" fill="${p.label}">${esc(String(upvotes))} ▲</text>`
  }
</svg>`;
}

/** Counts and ranks come from the database, so they get escaped into the SVG. */
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
