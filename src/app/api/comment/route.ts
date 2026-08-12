import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Comments are for feedback, not for link building. Anything that looks like a
// URL is rejected outright rather than silently stripped, so the commenter
// knows why their post didn't appear.
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ai|app|dev|xyz|me)\b)/i;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const parentId = typeof body?.parentId === "string" ? body.parentId : null;

  if (!productId) return NextResponse.json({ error: "Which product?" }, { status: 400 });
  if (text.length < 2) return NextResponse.json({ error: "Say a little more than that." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "That's over 2,000 characters." }, { status: 400 });
  if (LINK.test(text)) {
    return NextResponse.json({ error: "Links aren't allowed in comments." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("launch_comments")
    .insert({ product_id: productId, author_id: user.id, parent_id: parentId, body: text })
    .select("id")
    .single();

  if (error) {
    console.error("comment:", error.message);
    return NextResponse.json({ error: "Couldn't post that." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
