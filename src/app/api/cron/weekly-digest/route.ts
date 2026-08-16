import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getWeekBoard } from "@/lib/launches";
import { currentWeekKey, shiftWeek, weekLabel } from "@/lib/week";
import { chunk, emailConfigured, sendBatch, sendEmail } from "@/lib/email";
import { weeklyDigestEmail, type DigestWinner } from "@/lib/email-templates";
import { checkInsightsToken } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The Sunday digest.
 *
 * Emails everyone with a Saasgrave account (auth is shared across both sites,
 * so this genuinely reaches every user) the week's top three and headline
 * numbers. Fired by a Vercel cron on Sundays; Vercel attaches
 * `Authorization: Bearer $CRON_SECRET`, which is what we check.
 *
 * Query flags for operating it by hand:
 *   ?dry=1        — build everything, send nothing, return the plan + sample.
 *   ?test=you@x   — send only to that one address (for eyeballing the design).
 *   ?week=2026-W40 — override which week to report (defaults to last completed).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dry = searchParams.get("dry") === "1";
  const testTo = searchParams.get("test")?.trim() || null;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";
  // Default to the week that just finished — the digest reports a closed week.
  const targetWeek = searchParams.get("week")?.trim() || shiftWeek(currentWeekKey(), -1);

  const board = await getWeekBoard(targetWeek);
  const winners: DigestWinner[] = board.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    tagline: p.tagline,
    url: `${site}/products/${p.slug}`,
    upvotes: p.upvote_count,
  }));

  const stats = {
    launches: board.length,
    upvotes: board.reduce((sum, p) => sum + (p.upvote_count || 0), 0),
    makers: new Set(board.map((p) => p.maker_id)).size,
  };

  const { subject, html } = weeklyDigestEmail({
    weekLabel: weekLabel(targetWeek),
    winners,
    stats,
    boardUrl: `${site}/?w=${targetWeek}`,
    launchUrl: `${site}/launch`,
    siteUrl: site,
  });

  // ── single test send ──
  if (testTo) {
    const r = await sendEmail({ to: testTo, subject, html });
    return NextResponse.json({ mode: "test", to: testTo, week: targetWeek, result: r });
  }

  // ── gather every account's email (both sites share auth.users) ──
  const emails = await allUserEmails();

  if (dry) {
    return NextResponse.json({
      mode: "dry",
      week: targetWeek,
      subject,
      recipients: emails.length,
      winners: winners.map((w) => `${w.rank}. ${w.name} (${w.upvotes})`),
      stats,
      note: emailConfigured() ? "Would send now." : "RESEND_API_KEY not set — sending is a no-op.",
    });
  }

  if (!emailConfigured()) {
    return NextResponse.json({
      mode: "skipped",
      reason: "RESEND_API_KEY not set",
      recipients: emails.length,
      week: targetWeek,
    });
  }

  // ── send in batches of 100; one message per recipient, never a shared to ──
  let sent = 0;
  const errors: string[] = [];
  for (const group of chunk(emails, 100)) {
    const r = await sendBatch(group.map((to) => ({ to, subject, html })));
    if (r.ok) sent += group.length;
    else if (r.error) errors.push(r.error);
  }

  return NextResponse.json({
    mode: "sent",
    week: targetWeek,
    recipients: emails.length,
    sent,
    errors: errors.slice(0, 5),
  });
}

/** Accept the Vercel cron secret, or the admin insights bearer for manual runs. */
function authorized(request: Request): boolean {
  const auth = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  return checkInsightsToken(auth);
}

/** Every distinct, non-empty account email, paged through the admin API. */
async function allUserEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const seen = new Set<string>();
  const perPage = 1000;

  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("weekly-digest listUsers:", error.message);
      break;
    }
    const users = data?.users || [];
    for (const u of users) {
      const email = u.email?.trim().toLowerCase();
      if (email) seen.add(email);
    }
    if (users.length < perPage) break;
  }

  return [...seen];
}
