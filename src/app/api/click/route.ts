import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Counts a click through to a maker's site. Always answers 204 — the visitor
// has already navigated away and nothing here should ever surface an error.
export async function POST(request: Request) {
  try {
    const { slug } = await request.json();
    if (typeof slug === "string" && slug) {
      await createAdminClient().rpc("increment_launch_click", { p_slug: slug });
    }
  } catch {
    /* counters are best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
