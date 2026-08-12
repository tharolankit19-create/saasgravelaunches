import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Counts a click on a sponsor slot, for the buyer's dashboard.
export async function POST(request: Request) {
  try {
    const { adId } = await request.json();
    if (typeof adId === "string" && adId) {
      await createAdminClient().rpc("increment_ad_click", { p_ad: adId });
    }
  } catch {
    /* counters are best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
