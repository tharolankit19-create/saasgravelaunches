import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const { email, source } = await request.json().catch(() => ({ email: null }));

  if (typeof email !== "string" || !EMAIL.test(email.trim())) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  try {
    // Upsert, so signing up twice is a no-op rather than an error the
    // subscriber has to interpret.
    await createAdminClient()
      .from("launch_subscribers")
      .upsert(
        { email: email.trim().toLowerCase(), source: String(source || "site").slice(0, 40) },
        { onConflict: "email" }
      );
  } catch (e: any) {
    console.error("newsletter:", e?.message || e);
    return NextResponse.json({ error: "Couldn't sign you up. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
