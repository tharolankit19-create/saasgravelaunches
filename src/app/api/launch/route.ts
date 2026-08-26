import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSupportCount, getWeekSlots, isSupportGateActive } from "@/lib/launches";
import { FREE_LAUNCHES_PER_WEEK, SUPPORT_THRESHOLD, WEEK_SLOT_CAP } from "@/lib/pricing";
import { isPremium } from "@/lib/premium";
import { CATEGORY_NAMES } from "@/lib/categories";
import { normalizeUrl, slugify, truncate } from "@/lib/utils";
import { currentWeekKey, isPreLaunchWeek, parseWeekKey, weekLabel, weekStart } from "@/lib/week";
import { track } from "@/lib/analytics";
import { sendEmail } from "@/lib/email";
import { launchLiveEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

// Free makers get one launch a week; Premium lifts the cap. That's the
// cleanest thing a subscription can buy without touching the ranking.

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in to launch." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Nothing to publish." }, { status: 400 });

  // ── the one rule ──
  // The support gate only applies once the board has real depth — you can't
  // upvote three makers who aren't there yet. Checked here, not only in the UI,
  // so it holds even against a direct POST. Both reads run in parallel.
  const [gateActive, supported] = await Promise.all([
    isSupportGateActive(),
    getSupportCount(user.id),
  ]);
  if (gateActive && supported < SUPPORT_THRESHOLD) {
    await track({
      event: "publish_blocked",
      userId: user.id,
      meta: { reason: "support_gate", supported },
    });
    return NextResponse.json(
      {
        error: `Upvote ${SUPPORT_THRESHOLD - supported} more launch${
          SUPPORT_THRESHOLD - supported === 1 ? "" : "es"
        } before publishing your own.`,
      },
      { status: 403 }
    );
  }

  // ── validate ──
  const name = String(body.name || "").trim().slice(0, 60);
  const tagline = String(body.tagline || "").trim().slice(0, 80);
  const website = normalizeUrl(body.website_url);

  if (!name) return NextResponse.json({ error: "Your product needs a name." }, { status: 400 });
  if (!tagline) return NextResponse.json({ error: "Add a one-line tagline." }, { status: 400 });
  if (!website) {
    return NextResponse.json({ error: "That website URL doesn't look right." }, { status: 400 });
  }

  // ── which week is this launch scheduled into? ──
  // Founders pick a week; default to the current one. It must be a real,
  // present-or-future week (you can't launch into the past or before the
  // platform existed).
  const requestedWeek =
    typeof body.launch_week === "string" && parseWeekKey(body.launch_week)
      ? body.launch_week.trim()
      : currentWeekKey();
  const week =
    !isPreLaunchWeek(requestedWeek) &&
    weekStart(requestedWeek).getTime() >= weekStart(currentWeekKey()).getTime()
      ? requestedWeek
      : currentWeekKey();

  const premium = await isPremium(user.id);

  // ── weekly capacity: 20 free slots a week; Premium ignores the cap ──
  if (!premium) {
    const [slots] = await getWeekSlots([week]);
    if (slots && slots.open <= 0) {
      await track({
        event: "publish_blocked",
        userId: user.id,
        meta: { reason: "week_full", week },
      });
      return NextResponse.json(
        {
          error: `${weekLabel(week)} is full — all ${WEEK_SLOT_CAP} free slots are taken. Pick a later week, or go Premium to launch into any week even when it's full.`,
          upgrade: "premium",
          weekFull: true,
        },
        { status: 409 }
      );
    }
  }

  // ── one free launch per week per maker ──
  const { count: thisWeekCount } = await supabase
    .from("launch_products")
    .select("id", { count: "exact", head: true })
    .eq("maker_id", user.id)
    .eq("launch_week", week)
    .eq("status", "live");

  if (!premium && (thisWeekCount || 0) >= FREE_LAUNCHES_PER_WEEK) {
    await track({ event: "publish_blocked", userId: user.id, meta: { reason: "week_limit" } });
    return NextResponse.json(
      {
        error: `Free makers launch one product per week, and you've used ${weekLabel(week)}. Pick another week — or Premium lifts the limit entirely.`,
        upgrade: "premium",
      },
      { status: 429 }
    );
  }

  // ── badge gate ──
  // To launch, a free maker must put our "Featured on Saasgrave Launches" badge
  // on their site, and we verify it — that's the backlink loop that sends
  // traffic both ways. So the launch is created as a DRAFT and only goes live
  // once the badge is verified. Premium skips this; BADGE_REQUIRED=false turns
  // it off entirely.
  const badgeRequired = process.env.BADGE_REQUIRED !== "false";
  const gateBadge = badgeRequired && !premium;

  const { data: existing } = await supabase
    .from("launch_products")
    .select("slug, status")
    .eq("maker_id", user.id)
    .eq("website_url", website)
    .maybeSingle();

  if (existing) {
    // Already live → nothing to do. Still a draft from a prior attempt → send
    // them straight back to the badge step for that draft.
    if (existing.status === "live") {
      return NextResponse.json(
        { error: "You've already launched that URL.", slug: existing.slug },
        { status: 409 }
      );
    }
    return NextResponse.json({ needsBadge: true, slug: existing.slug, resumed: true });
  }

  // ── shape the row ──
  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c: unknown) => typeof c === "string" && CATEGORY_NAMES.includes(c)).slice(0, 2)
    : [];

  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((k: unknown) => typeof k === "string").map((k: string) => k.trim().slice(0, 60)).slice(0, 8)
    : [];

  // Screenshots the maker uploaded (public Supabase storage URLs) plus any OG
  // image autofill seeded. Keep only our own http(s) URLs, cap at five.
  const gallery = Array.isArray(body.gallery_urls)
    ? body.gallery_urls
        .filter((u: unknown): u is string => typeof u === "string")
        .map((u: string) => normalizeUrl(u))
        .filter((u: string | null): u is string => Boolean(u))
        .slice(0, 5)
    : [];

  const alternatives = Array.isArray(body.alternatives)
    ? body.alternatives.filter((a: unknown) => typeof a === "string").map((a: string) => a.trim().slice(0, 40)).slice(0, 3)
    : [];

  // FAQ: keep only well-formed {q,a} pairs the autofill produced.
  const faq = Array.isArray(body.faq)
    ? body.faq
        .map((it: unknown) => {
          const o = it as Record<string, unknown>;
          const q = typeof o?.q === "string" ? o.q.trim().slice(0, 160) : "";
          const a = typeof o?.a === "string" ? o.a.trim().slice(0, 500) : "";
          return q && a ? { q, a } : null;
        })
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? truncate(v.trim(), max) : null;

  /**
   * Accept a company social however the founder types it — a full URL, a bare
   * domain path, or just the handle — and store one canonical URL. Anything
   * that isn't on the expected host is dropped rather than linked blindly.
   */
  const socialUrl = (v: unknown, host: string): string | null => {
    if (typeof v !== "string" || !v.trim()) return null;
    let raw = v.trim();
    if (raw.startsWith("@")) raw = raw.slice(1);
    if (!/^https?:\/\//i.test(raw)) {
      raw = raw.includes(".") ? `https://${raw}` : `https://${host}/${raw}`;
    }
    try {
      const u = new URL(raw);
      const h = u.hostname.replace(/^www\./, "").toLowerCase();
      const ok = host === "x.com" ? h === "x.com" || h === "twitter.com" : h.endsWith(host);
      if (!ok) return null;
      return u.toString().slice(0, 250);
    } catch {
      return null;
    }
  };

  const slug = await uniqueSlug(name);

  const row = {
    maker_id: user.id,
    slug,
    name,
    tagline,
    description: text(body.description, 700),
    website_url: website,
    logo_url: normalizeUrl(body.logo_url),
    gallery_urls: gallery,
    categories: categories.length ? categories : ["Other"],
    pricing_model: text(body.pricing_model, 20),
    who_for: text(body.who_for, 120),
    problem: text(body.problem, 400),
    solution: text(body.solution, 400),
    unique_edge: text(body.unique_edge, 400),
    keywords,
    alternatives,
    faq,
    maker_note: text(body.maker_note, 800),
    // Company socials — both optional, stored as full URLs so the product page
    // can link straight out.
    x_url: socialUrl(body.x_url, "x.com"),
    linkedin_url: socialUrl(body.linkedin_url, "linkedin.com"),
    seo_title: `${name} — ${tagline}`.slice(0, 70),
    seo_description: text(body.description, 155) || `${name}: ${tagline}`.slice(0, 155),
    // Gated launches start as a draft and go live on badge verification.
    status: gateBadge ? "draft" : "live",
    launch_week: week,
    launched_at: gateBadge ? null : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("launch_products")
    .insert(row)
    .select("slug")
    .single();

  if (error) {
    console.error("launch:", error.message);
    await track({ event: "publish_error", userId: user.id, meta: { message: error.message } });
    return NextResponse.json({ error: "Couldn't publish that. Try again in a moment." }, { status: 500 });
  }

  // Gated: hold as a draft and send the maker to the badge step. The launch
  // goes live (and the "you're live" email fires) from the verify-badge route.
  if (gateBadge) {
    await track({ event: "publish_pending_badge", userId: user.id, productSlug: data.slug });
    return NextResponse.json({ needsBadge: true, slug: data.slug });
  }

  await track({ event: "publish_success", userId: user.id, productSlug: data.slug });

  // "Your product is live." Best-effort and no-op until RESEND_API_KEY is set —
  // never let a mail hiccup fail a launch that already succeeded.
  if (user.email) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
    const mail = launchLiveEmail({
      productName: name,
      tagline,
      productUrl: `${site}/products/${data.slug}`,
      boardUrl: site,
      siteUrl: site,
    });
    try {
      await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
    } catch (e: any) {
      console.error("launch email:", e?.message || e);
    }
  }

  return NextResponse.json({ slug: data.slug });
}

/**
 * A slug nobody else owns. Checked through the service role because the
 * conflicting product might belong to another maker, whose drafts this user
 * can't see — without that, two drafts could both think "acme" is free and the
 * second insert would fail with a raw database error.
 */
async function uniqueSlug(name: string): Promise<string> {
  const stem = slugify(name) || "product";
  const admin = createAdminClient();

  const { data } = await admin
    .from("launch_products")
    .select("slug")
    .like("slug", `${stem}%`)
    .limit(50);

  const taken = new Set((data || []).map((r: any) => r.slug as string));
  if (!taken.has(stem)) return stem;

  for (let i = 2; i < 60; i++) {
    const candidate = `${stem}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${stem}-${Date.now().toString(36).slice(-4)}`;
}
