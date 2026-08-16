import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only the routes that genuinely need a session run through the auth branch.
// The board, product pages and the directory are public and skip the auth
// round-trip entirely, which is most of why browsing feels instant.
const PROTECTED = ["/dashboard", "/launch", "/admin"];

// ── Landing A/B ──
// Send a slice of first-time landing visitors straight to the leaderboard, to
// test whether a proof-first entry converts better than the pitch. It's a
// ONE-TIME redirect (we set a cookie the first time, and never bounce them
// again), so navigation is never trapped. Tune with AB_LEADERBOARD_PERCENT
// (0 disables it); default 35%.
const AB_COOKIE = "ab_land";
function leaderboardPercent(): number {
  const raw = Number(process.env.AB_LEADERBOARD_PERCENT);
  if (Number.isFinite(raw)) return Math.max(0, Math.min(100, raw));
  return 35;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ── A/B on the bare landing page only ──
  if (path === "/") {
    const url = request.nextUrl;
    const ua = request.headers.get("user-agent") || "";
    const isBot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly/i.test(ua);
    const alreadyBucketed = request.cookies.has(AB_COOKIE);
    const percent = leaderboardPercent();

    // Only bucket a genuine first human hit of "/" with no query (week nav,
    // campaign params etc. are left alone), and never a crawler.
    if (!alreadyBucketed && !isBot && percent > 0 && url.search === "") {
      const toLeaderboard = Math.random() * 100 < percent;
      const variant = toLeaderboard ? "b" : "a";

      const res = toLeaderboard
        ? NextResponse.redirect(new URL("/leaderboard?from=home", request.url))
        : NextResponse.next({ request });

      res.cookies.set(AB_COOKIE, variant, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
      return res;
    }

    return NextResponse.next({ request });
  }

  // ── auth-gated routes ──
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (PROTECTED.some((p) => path.startsWith(p)) && !user) {
    // Preserve the full destination, query and all, so a visitor who came from
    // the hero with ?url=… lands back on /launch with autofill ready — rather
    // than losing it. Build the login URL fresh so the original query doesn't
    // leak in as stray params beside `next`.
    const dest = path + request.nextUrl.search;
    const login = new URL("/login", request.url);
    login.searchParams.set("next", dest);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/launch/:path*", "/admin/:path*"],
};
