import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSupportCount, getWeekSlots, isSupportGateActive } from "@/lib/launches";
import { FREE_LAUNCHES_PER_WEEK, SUPPORT_THRESHOLD, WEEK_SLOT_CAP } from "@/lib/pricing";
import { isPremium } from "@/lib/premium";
import { CATEGORY_NAMES } from "@/lib/categories";
import { normalizeUrl, slugify } from "@/lib/utils";
import { shapeLaunch } from "@/lib/launch-shape";
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

  // How the maker asked for this launch to be handled, read once up front
  // because the capacity and support checks below all depend on it.
  const paidIntent = body.intent === "premium_launch";
  // "Save as draft" — the founder isn't finished and hasn't chosen anything yet.
  const savingDraft = body.intent === "draft";

  // ── the one rule ──
  // The support gate only applies once the board has real depth — you can't
  // upvote three makers who aren't there yet. Checked here, not only in the UI,
  // so it holds even against a direct POST. Both reads run in parallel.
  const [gateActive, supported] = await Promise.all([
    isSupportGateActive(),
    getSupportCount(user.id),
  ]);
  if (gateActive && supported < SUPPORT_THRESHOLD && !savingDraft) {
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

  // A draft is allowed to be half-finished — that's what saving one is for.
  // Publishing still requires all three.
  if (!name) {
    return NextResponse.json(
      { error: savingDraft ? "Give your draft a name before saving it." : "Your product needs a name." },
      { status: 400 }
    );
  }
  if (!savingDraft) {
    if (!tagline) return NextResponse.json({ error: "Add a one-line tagline." }, { status: 400 });
    if (!website) {
      return NextResponse.json({ error: "That website URL doesn't look right." }, { status: 400 });
    }
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
  // Skipped while saving a draft: no slot is consumed until it publishes, and
  // a full week is a reason to pick another one later, not to lose the writing.
  if (!premium && !savingDraft) {
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

  if (!premium && !savingDraft && (thisWeekCount || 0) >= FREE_LAUNCHES_PER_WEEK) {
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

  // The maker chose how this launch publishes on the configure step. A paid
  // launch is held as a draft here and published by fulfilment once the payment
  // clears, so a listing is never live before it was either paid for or
  // verified. Free is the fallback for anything we don't recognise.
  const gateBadge = !paidIntent && !savingDraft && badgeRequired && !premium;

  // Have they already got this URL on the board? Only meaningful once a URL has
  // actually been typed — several unfinished drafts can share an empty one.
  const { data: existing } = website
    ? await supabase
        .from("launch_products")
        .select("slug, status")
        .eq("maker_id", user.id)
        .eq("website_url", website)
        .maybeSingle()
    : { data: null };

  if (existing) {
    // Already live → nothing to do. Still a draft from a prior attempt → send
    // them back to whichever step finishes it: payment, or the badge.
    if (existing.status === "live") {
      return NextResponse.json(
        { error: "You've already launched that URL.", slug: existing.slug },
        { status: 409 }
      );
    }
    if (savingDraft) {
      return NextResponse.json({ draft: true, slug: existing.slug, resumed: true });
    }
    if (paidIntent) {
      return NextResponse.json({ needsPayment: true, slug: existing.slug, resumed: true });
    }
    return NextResponse.json({ needsBadge: true, slug: existing.slug, resumed: true });
  }

  // ── shape the row ──
  const shaped = shapeLaunch(body, { requireEssentials: !savingDraft });
  if ("error" in shaped) return NextResponse.json({ error: shaped.error }, { status: 400 });

  const slug = await uniqueSlug(name);

  // A launch the maker is only parking for later never publishes, whatever
  // else they picked — that's the entire point of "save as draft".
  const held = gateBadge || paidIntent || savingDraft;

  const row = {
    maker_id: user.id,
    slug,
    ...shaped.fields,
    // A launch is live only once it's been earned: gated ones go live on badge
    // verification, paid ones when fulfilment confirms the payment.
    status: held ? "draft" : "live",
    launch_week: week,
    launched_at: held ? null : new Date().toISOString(),
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
  if (savingDraft) {
    await track({ event: "draft_saved", userId: user.id, productSlug: data.slug });
    return NextResponse.json({ draft: true, slug: data.slug });
  }

  if (paidIntent) {
    await track({ event: "publish_pending_payment", userId: user.id, productSlug: data.slug });
    return NextResponse.json({ needsPayment: true, slug: data.slug });
  }

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
 * Read one of the maker's own drafts back, so the launch form can be reopened
 * with everything they'd written still in it. Owner-only, drafts only — a live
 * listing is not edited through this route.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const slug = new URL(request.url).searchParams.get("draft")?.slice(0, 80) || "";
  if (!slug) return NextResponse.json({ error: "Which draft?" }, { status: 400 });

  const { data: draft } = await supabase
    .from("launch_products")
    .select(
      "slug, status, maker_id, name, tagline, description, website_url, logo_url, gallery_urls, categories, pricing_model, who_for, problem, solution, unique_edge, keywords, alternatives, faq, maker_note, x_url, linkedin_url, launch_week"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  if (draft.maker_id !== user.id) {
    return NextResponse.json({ error: "That isn't your draft." }, { status: 403 });
  }
  if (draft.status === "live") {
    return NextResponse.json({ error: "That launch is already live.", slug }, { status: 409 });
  }

  return NextResponse.json({ draft });
}

/**
 * Update a draft the maker already started — the edit half of "save as draft".
 *
 * Only ever touches a draft they own, and it can publish that draft too: pass
 * `publish: true` with the same intent the configure step resolved. The rules
 * for whether it may actually go live are identical to POST's, because a draft
 * must not become a back door around the badge or the payment.
 */
export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });

  const slug = typeof body.slug === "string" ? body.slug.slice(0, 80) : "";
  if (!slug) return NextResponse.json({ error: "Which draft?" }, { status: 400 });

  const publish = body.publish === true;
  const paidIntent = body.intent === "premium_launch";

  const { data: draft } = await supabase
    .from("launch_products")
    .select("id, slug, status, maker_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  if (draft.maker_id !== user.id) {
    return NextResponse.json({ error: "That isn't your draft." }, { status: 403 });
  }
  if (draft.status === "live") {
    return NextResponse.json({ error: "That launch is already live.", slug }, { status: 409 });
  }

  const shaped = shapeLaunch(body, { requireEssentials: publish });
  if ("error" in shaped) return NextResponse.json({ error: shaped.error }, { status: 400 });

  // The week can be moved while it's still a draft.
  const requestedWeek =
    typeof body.launch_week === "string" && parseWeekKey(body.launch_week)
      ? body.launch_week.trim()
      : currentWeekKey();
  const week =
    !isPreLaunchWeek(requestedWeek) &&
    weekStart(requestedWeek).getTime() >= weekStart(currentWeekKey()).getTime()
      ? requestedWeek
      : currentWeekKey();

  const { error } = await supabase
    .from("launch_products")
    .update({ ...shaped.fields, launch_week: week })
    .eq("id", draft.id)
    .eq("maker_id", user.id);

  if (error) {
    console.error("launch patch:", error.message);
    return NextResponse.json({ error: "Couldn't save those changes." }, { status: 500 });
  }

  if (!publish) {
    await track({ event: "draft_saved", userId: user.id, productSlug: slug });
    return NextResponse.json({ draft: true, slug });
  }

  // ── publishing an edited draft ── same gates as a fresh launch.
  const [gateActive, supported] = await Promise.all([
    isSupportGateActive(),
    getSupportCount(user.id),
  ]);
  if (gateActive && supported < SUPPORT_THRESHOLD) {
    return NextResponse.json(
      {
        error: `Upvote ${SUPPORT_THRESHOLD - supported} more launch${
          SUPPORT_THRESHOLD - supported === 1 ? "" : "es"
        } before publishing your own.`,
      },
      { status: 403 }
    );
  }

  const premium = await isPremium(user.id);
  if (!premium && !paidIntent) {
    const [slots] = await getWeekSlots([week]);
    if (slots && slots.open <= 0) {
      return NextResponse.json(
        {
          error: `${weekLabel(week)} is full — all ${WEEK_SLOT_CAP} free slots are taken. Pick a later week, or publish it now with a Premium Launch.`,
          upgrade: "premium",
          weekFull: true,
        },
        { status: 409 }
      );
    }
  }

  // Paid launches wait for the payment; free ones wait for the badge. Either
  // way the row stays a draft here — nothing publishes on this path alone.
  if (paidIntent) {
    await track({ event: "publish_pending_payment", userId: user.id, productSlug: slug });
    return NextResponse.json({ needsPayment: true, slug });
  }

  const badgeRequired = process.env.BADGE_REQUIRED !== "false";
  if (badgeRequired && !premium) {
    await track({ event: "publish_pending_badge", userId: user.id, productSlug: slug });
    return NextResponse.json({ needsBadge: true, slug });
  }

  const { error: pubErr } = await supabase
    .from("launch_products")
    .update({ status: "live", launched_at: new Date().toISOString() })
    .eq("id", draft.id)
    .eq("maker_id", user.id);
  if (pubErr) {
    return NextResponse.json({ error: "Couldn't publish that draft." }, { status: 500 });
  }

  await track({ event: "publish_success", userId: user.id, productSlug: slug });
  return NextResponse.json({ slug });
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
