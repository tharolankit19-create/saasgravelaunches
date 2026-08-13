import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Only the routes that genuinely need a session run through here. The board,
// product pages and the directory are public and skip the auth round-trip
// entirely, which is most of why browsing feels instant.
const PROTECTED = ["/dashboard", "/launch", "/admin"];

export async function middleware(request: NextRequest) {
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

  const path = request.nextUrl.pathname;
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
  matcher: ["/dashboard/:path*", "/launch/:path*", "/admin/:path*"],
};
