import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSupportCount } from "@/lib/launches";
import { SUPPORT_THRESHOLD } from "@/lib/pricing";
import { CATEGORY_NAMES } from "@/lib/categories";
import { normalizeUrl, slugify, truncate } from "@/lib/utils";
import { currentWeekKey } from "@/lib/week";
import { track } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** How many launches one maker can put on a single week's board. */
const MAX_PER_WEEK = 2;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in to launch." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Nothing to publish." }, { status: 400 });

  // ── the one rule ──
  // Checked here rather than only in the UI: the gate is what keeps the board
  // honest, so it has to hold even if someone posts straight at the API.
  const supported = await getSupportCount(user.id);
  if (supported < SUPPORT_THRESHOLD) {
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

  const week = currentWeekKey();

  // ── anti-spam, in the two ways that actually matter ──
  const { count: thisWeekCount } = await supabase
    .from("launch_products")
    .select("id", { count: "exact", head: true })
    .eq("maker_id", user.id)
    .eq("launch_week", week)
    .eq("status", "live");

  if ((thisWeekCount || 0) >= MAX_PER_WEEK) {
    await track({ event: "publish_blocked", userId: user.id, meta: { reason: "week_limit" } });
    return NextResponse.json(
      { error: `You can launch ${MAX_PER_WEEK} products a week. Next week's board opens Monday.` },
      { status: 429 }
    );
  }

  const { data: duplicate } = await supabase
    .from("launch_products")
    .select("slug")
    .eq("maker_id", user.id)
    .eq("website_url", website)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: "You've already launched that URL.", slug: duplicate.slug },
      { status: 409 }
    );
  }

  // ── shape the row ──
  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c: unknown) => typeof c === "string" && CATEGORY_NAMES.includes(c)).slice(0, 2)
    : [];

  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((k: unknown) => typeof k === "string").map((k: string) => k.trim().slice(0, 60)).slice(0, 8)
    : [];

  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? truncate(v.trim(), max) : null;

  const slug = await uniqueSlug(name);

  const row = {
    maker_id: user.id,
    slug,
    name,
    tagline,
    description: text(body.description, 700),
    website_url: website,
    logo_url: normalizeUrl(body.logo_url),
    categories: categories.length ? categories : ["Other"],
    pricing_model: text(body.pricing_model, 20),
    who_for: text(body.who_for, 120),
    problem: text(body.problem, 400),
    solution: text(body.solution, 400),
    unique_edge: text(body.unique_edge, 400),
    keywords,
    maker_note: text(body.maker_note, 800),
    seo_title: `${name} — ${tagline}`.slice(0, 70),
    seo_description: text(body.description, 155) || `${name}: ${tagline}`.slice(0, 155),
    status: "live",
    launch_week: week,
    launched_at: new Date().toISOString(),
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

  await track({ event: "publish_success", userId: user.id, productSlug: data.slug });
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
