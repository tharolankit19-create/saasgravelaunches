import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Writes the shared `profiles` row — the same one Saasgrave reads.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const text = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(body.full_name, 80),
      maker_headline: text(body.maker_headline, 90),
      bio: text(body.bio, 400),
      x_handle: text(body.x_handle, 40)?.replace(/^@/, "") ?? null,
      github_handle: text(body.github_handle, 40)?.replace(/^@/, "") ?? null,
      website_url: normalizeUrl(body.website_url),
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile:", error.message);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
