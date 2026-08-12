import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Toggle an upvote.
 *
 * The whole operation is one `security definer` RPC so the vote row and the
 * denormalised counter can never disagree, and so a client can't insert a vote
 * for somebody else — `auth.uid()` inside the function is the only identity
 * involved.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to upvote." }, { status: 401 });
  }

  const { productId } = await request.json().catch(() => ({ productId: null }));
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "Which product?" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("toggle_launch_upvote", { p_product: productId });

  if (error) {
    console.error("upvote:", error.message);
    return NextResponse.json({ error: "Couldn't register that vote." }, { status: 500 });
  }

  // The RPC returns a one-row table.
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ count: row?.count ?? 0, upvoted: Boolean(row?.upvoted) });
}
