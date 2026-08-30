import { NextResponse } from "next/server";
import { syncSaasgraveStartups } from "@/lib/saasgrave-sync";
import { checkInsightsToken, isAdmin } from "@/lib/admin";
import { currentWeekKey } from "@/lib/week";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Mirror new Saasgrave startups onto the launch board.
 *
 * Runs on a Vercel cron every Monday morning, so anything listed on Saasgrave
 * during the previous week goes up with that week's board. One-way and
 * idempotent — a startup already mirrored is never duplicated, and `startups`
 * is only ever read.
 *
 * Flags for running it by hand:
 *   ?dry=1              — report what it would do, write nothing.
 *   ?week=2026-W36      — target a specific week (default: the current one).
 *   ?status=draft       — stage instead of publishing.
 *   ?limit=25           — cap per run.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const auth = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const viaCron = Boolean(cronSecret) && auth === `Bearer ${cronSecret}`;

  if (!viaCron && !checkInsightsToken(auth) && !(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const week = url.searchParams.get("week") || currentWeekKey();
  const status = url.searchParams.get("status") === "draft" ? "draft" : "live";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const dry = url.searchParams.get("dry") === "1";

  const result = await syncSaasgraveStartups({ week, status, limit, dryRun: dry });
  return NextResponse.json({ dry, week, status, ...result });
}

/** POST does the same thing — handy for a manual trigger from the admin UI. */
export async function POST(request: Request) {
  return GET(request);
}
