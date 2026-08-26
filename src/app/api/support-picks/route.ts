import { NextResponse } from "next/server";
import { createAdminClient, currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Three live products to support before you launch. We surface the ones with
 * the fewest upvotes first — the makers who most need a hand — and never the
 * caller's own products. Read through the service role so it works before the
 * new launch exists.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const user = await currentUser().catch(() => null);

    let query = admin
      .from("launch_products")
      .select("id, slug, name, tagline, website_url, logo_url, upvote_count")
      .eq("status", "live")
      .order("upvote_count", { ascending: true })
      .limit(12);
    if (user) query = query.neq("maker_id", user.id);

    const { data } = await query;
    const picks = (data || []).slice(0, 3);
    return NextResponse.json({ picks });
  } catch {
    return NextResponse.json({ picks: [] });
  }
}
