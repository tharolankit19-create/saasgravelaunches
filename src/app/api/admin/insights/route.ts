import { NextResponse } from "next/server";
import { buildInsights, type Insights } from "@/lib/insights";
import { checkInsightsToken, isAdmin } from "@/lib/admin";
import { aiComplete, aiConfigured } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * The traffic diagnosis, as JSON.
 *
 * Two ways in: a signed-in admin (the /admin page uses this shape), or a
 * bearer token in `ADMIN_INSIGHTS_TOKEN` — that's how the Hermes watcher polls
 * it unattended. No token set means no machine access; it never falls open.
 *
 *   GET /api/admin/insights?days=7&narrate=1
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const authorized =
    checkInsightsToken(request.headers.get("authorization")) || (await isAdmin());

  if (!authorized) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const days = clamp(Number(url.searchParams.get("days") || 7), 1, 90);
  const insights = await buildInsights(days);

  const wantsNarration = url.searchParams.get("narrate") === "1";
  const narrative = wantsNarration ? await narrate(insights) : null;

  return NextResponse.json(
    { ...insights, narrative },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
}

/**
 * Turn the findings into three sentences an operator can act on.
 *
 * The model is only allowed to rephrase findings that the rules already
 * produced — it is never the thing that decides something is wrong. If the AI
 * is unset or failing, the caller still gets the full structured findings.
 */
async function narrate(insights: Insights): Promise<string | null> {
  if (!aiConfigured() || insights.findings.length === 0) return null;

  const facts = [
    `Window: last ${insights.windowDays} days`,
    `Sessions: ${insights.totals.sessions}, page views: ${insights.totals.pageViews}`,
    `Launches published: ${insights.totals.publishes}, live this week: ${insights.content.liveThisWeek}`,
    `Top sources: ${insights.sources.slice(0, 3).map((s) => `${s.label} (${s.sessions})`).join(", ") || "none"}`,
    `Funnel: ${insights.funnel.map((f) => `${f.label} ${f.sessions}`).join(" → ")}`,
    "",
    "Findings already established by the rules:",
    ...insights.findings.map((f) => `- [${f.severity}] ${f.title}: ${f.detail} Action: ${f.action}`),
  ].join("\n");

  try {
    return await aiComplete(
      `You are briefing the operator of a product launch site on today's traffic.

Write at most three short sentences. Lead with the single most urgent finding and what to do about it. Use only the findings listed — do not invent problems, numbers or causes. No preamble, no bullet points, no headings.

${facts}`,
      { maxTokens: 260, temperature: 0.2 }
    );
  } catch (e: any) {
    console.error("narrate:", e?.message || e);
    return null;
  }
}
