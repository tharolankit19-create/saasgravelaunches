import { NextResponse } from "next/server";
import { track, TRACKED_EVENTS } from "@/lib/analytics";
import { currentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The telemetry sink. Deliberately permissive about failure and strict about
 * input: only known event names are stored, so a scripted flood can't invent
 * new event types and poison the funnel maths.
 *
 * Always answers 204 — a visitor's browser should never see an analytics
 * error, and an attacker shouldn't learn anything from one either.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.event || typeof body.event !== "string") {
      return new NextResponse(null, { status: 204 });
    }
    if (!TRACKED_EVENTS.has(body.event)) {
      return new NextResponse(null, { status: 204 });
    }

    // The user id comes from the session cookie, never from the request body.
    const user = await currentUser().catch(() => null);

    await track({
      event: body.event,
      path: typeof body.path === "string" ? body.path : null,
      referrer:
        typeof body.referrer === "string" ? body.referrer : request.headers.get("referer"),
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      userId: user?.id || null,
      productSlug: typeof body.productSlug === "string" ? body.productSlug : null,
      meta: body.meta && typeof body.meta === "object" ? body.meta : {},
    });
  } catch {
    // swallowed on purpose
  }

  return new NextResponse(null, { status: 204 });
}
