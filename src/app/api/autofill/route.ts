import { NextResponse } from "next/server";
import { autofillFromUrl } from "@/lib/autofill";
import { currentUser } from "@/lib/supabase/server";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Read a maker's site and draft their listing.
 *
 * Signed-in only — this makes an outbound request on the caller's behalf, and
 * an open endpoint that fetches arbitrary URLs is a proxy waiting to be abused.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { url } = await request.json().catch(() => ({ url: null }));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Paste your product's URL." }, { status: 400 });
  }

  try {
    const result = await autofillFromUrl(url);

    await track({
      event: result.source.scraped ? "autofill_success" : "autofill_error",
      userId: user.id,
      meta: { ai: result.source.ai, note: result.source.note?.slice(0, 200) },
    });

    // A page we couldn't read at all is worth saying out loud — the maker can
    // still type five fields, but they should know why nothing appeared.
    if (!result.source.scraped) {
      return NextResponse.json(
        { error: result.source.note || "Couldn't read that site." },
        { status: 422 }
      );
    }

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
