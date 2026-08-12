import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth + email-confirmation callback. Exchanges the code for a session and
// sends the visitor back to whatever they were trying to do.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  // Only ever redirect within this site — an open redirect here would let a
  // phishing link borrow our OAuth flow.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
