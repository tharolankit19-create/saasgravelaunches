import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const UA =
  "Mozilla/5.0 (compatible; SaasgraveLaunchesBot/1.0; +https://ls.saasgrave.org/about)";
const TIMEOUT_MS = 9_000;
const MAX_BYTES = 1_500_000;

/**
 * Verify a maker's backlink — the "verified member" check.
 *
 * The maker pastes our badge on their own site; we fetch that page's RAW HTML
 * (not Firecrawl's main-content markdown, which would strip a footer badge) and
 * confirm it really links back to this launch. If it does, the launch is marked
 * verified. Owner-only, since it acts on their product.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug.slice(0, 80) : "";
  if (!slug) return NextResponse.json({ error: "Missing product." }, { status: 400 });

  const { data: product } = await supabase
    .from("launch_products")
    .select("id, slug, website_url, maker_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) return NextResponse.json({ error: "Launch not found." }, { status: 404 });
  if (product.maker_id !== user.id) {
    return NextResponse.json({ error: "That isn't your launch." }, { status: 403 });
  }

  const site = normalizeUrl(product.website_url);
  if (!site) return NextResponse.json({ error: "This launch has no website to check." }, { status: 400 });

  const parsed = new URL(site);
  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "That site isn't reachable publicly." }, { status: 400 });
  }

  // ── fetch the raw homepage ──
  let html = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(site, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json(
        { verified: false, error: `Your site answered ${res.status}. Publish it and try again.` },
        { status: 200 }
      );
    }
    html = (await res.text()).slice(0, MAX_BYTES);
  } catch (e: any) {
    return NextResponse.json(
      {
        verified: false,
        error:
          e?.name === "AbortError"
            ? "Your site took too long to answer."
            : "Couldn't reach your site. Is it live?",
      },
      { status: 200 }
    );
  }

  // ── does the page really link back? ──
  const hay = html.toLowerCase();
  const s = slug.toLowerCase();
  const verified =
    hay.includes(`/products/${s}`) ||
    hay.includes(`slug=${s}`) ||
    hay.includes(`/api/badge/${s}`) ||
    hay.includes(`badge/${s}`);

  // Persist the result. Wrapped defensively: if the badge_verified columns
  // aren't in the database yet (schema.sql not re-run), say so plainly rather
  // than 500.
  try {
    const admin = createAdminClient();
    const patch: Record<string, unknown> = { badge_checked_at: new Date().toISOString() };
    if (verified) {
      patch.badge_verified = true;
      patch.badge_verified_at = new Date().toISOString();
    }
    const { error } = await admin.from("launch_products").update(patch).eq("id", product.id);
    if (error) throw error;
  } catch (e: any) {
    console.error("verify-badge update:", e?.message || e);
    return NextResponse.json(
      {
        verified,
        error:
          "Found the badge, but couldn't save it — run the latest supabase/schema.sql to add the badge_verified columns.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    verified,
    error: verified
      ? null
      : "We fetched your homepage but didn't find the badge yet. Make sure it's published and in the page HTML, then try again.",
  });
}

/** Refuse private/link-local hosts — this is a server making the maker's request. */
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) {
    return true;
  }
  if (/^\[?::1\]?$/.test(h)) return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}
