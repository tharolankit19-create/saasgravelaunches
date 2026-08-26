import { NextResponse } from "next/server";
import { autofillFromUrl, autofillQuick } from "@/lib/autofill";
import { currentUser } from "@/lib/supabase/server";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Headroom for the pathological path (Firecrawl errors → fetch fallback → the
// full AI ladder). The per-step timeouts keep the common case to a few seconds;
// this only stops a rare slow chain from 504-ing instead of degrading.
export const maxDuration = 60;

/**
 * Read a maker's site and draft their listing.
 *
 * Signed-in only — this makes an outbound request on the caller's behalf, and
 * an open endpoint that fetches arbitrary URLs is a proxy waiting to be abused.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { url, stage } = await request.json().catch(() => ({ url: null, stage: null }));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Paste your product's URL." }, { status: 400 });
  }

  try {
    // stage "quick" skips the model entirely so the form fills in a second or
    // two; the client then calls again for the AI pass, which reuses the
    // cached scrape.
    const result = stage === "quick" ? await autofillQuick(url) : await autofillFromUrl(url);

    await track({
      event: result.source.scraped ? "autofill_success" : "autofill_error",
      userId: user.id,
      meta: { ai: result.source.ai, note: result.source.note?.slice(0, 200) },
    });

    // Never hard-error: even when the page was unreadable we still return the
    // URL and a name guessed from the domain, so the founder lands on a
    // partly-filled form instead of a red wall. The client reads
    // `source.scraped` to decide the message.
    return NextResponse.json(result);
  } catch (e: any) {
    await track({
      event: "autofill_error",
      userId: user.id,
      meta: { message: String(e?.message).slice(0, 200) },
    });
    return NextResponse.json(
      { error: e?.message || "Couldn't read that site." },
      { status: 422 }
    );
  }
}
