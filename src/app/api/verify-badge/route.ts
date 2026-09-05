import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { launchLiveEmail } from "@/lib/email-templates";
import { track } from "@/lib/analytics";
import { hasBadgeLink } from "@/lib/badge-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const UA =
  "Mozilla/5.0 (compatible; SaasgraveLaunchesBot/1.0; +https://ls.saasgrave.org/about)";
const TIMEOUT_MS = 9_000;
const MAX_BYTES = 1_500_000;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

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
    .select("id, slug, name, tagline, website_url, maker_id, status")
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
  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    res = await fetch(site, {
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
  // Parsed properly: a real href/src, resolved, pointing at OUR host and naming
  // THIS launch. Substring matching was not enough — the slug comes from the
  // product's own name, so a maker's own /products/<slug> page passed the check
  // without the badge ever being added.
  const verified = hasBadgeLink(html, res.url || site, SITE, slug);

  if (!verified) {
    // Record the attempt (best-effort), then tell them plainly.
    try {
      await createAdminClient()
        .from("launch_products")
        .update({ badge_checked_at: new Date().toISOString() })
        .eq("id", product.id);
    } catch {
      /* columns may not be migrated yet — harmless */
    }
    return NextResponse.json({
      verified: false,
      error:
        "We fetched your homepage but couldn't find a link back to this launch. The badge has to be live in your page's HTML and link to your product page here — copy the snippet above exactly, publish, then try again.",
    });
  }

  // ── verified ──
  const admin = createAdminClient();
  const wasDraft = product.status === "draft";

  // 1. Publish the draft using ONLY guaranteed columns. This must never be
  //    blocked by a missing badge_verified column, or a gated launch could get
  //    stuck as a draft before the migration is applied.
  if (wasDraft) {
    const { error } = await admin
      .from("launch_products")
      .update({ status: "live", launched_at: new Date().toISOString() })
      .eq("id", product.id);
    if (error) {
      console.error("verify-badge publish:", error.message);
      return NextResponse.json(
        { verified: true, error: "Found the badge, but couldn't publish — try verify again." },
        { status: 200 }
      );
    }
  }

  // 2. Record the verification flag — best-effort. If the badge_verified columns
  //    aren't migrated yet, the launch still went live; the Verified mark just
  //    won't show until schema.sql is run.
  try {
    await admin
      .from("launch_products")
      .update({
        badge_verified: true,
        badge_verified_at: new Date().toISOString(),
        badge_checked_at: new Date().toISOString(),
      })
      .eq("id", product.id);
  } catch (e: any) {
    console.error("verify-badge flag (non-fatal):", e?.message || e);
  }

  if (wasDraft) {
    await track({ event: "publish_success", userId: user.id, productSlug: product.slug });
    if (user.email) {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
      const mail = launchLiveEmail({
        productName: product.name,
        tagline: product.tagline,
        productUrl: `${site}/products/${product.slug}`,
        boardUrl: site,
        siteUrl: site,
      });
      try {
        await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
      } catch (e: any) {
        console.error("verify-badge email:", e?.message || e);
      }
    }
  }

  return NextResponse.json({ verified: true, published: wasDraft, slug: product.slug });
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
