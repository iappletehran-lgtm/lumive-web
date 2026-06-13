import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate for the private areas. Runs on /dashboard/* and /admin/* (see the
 * matcher below). It refreshes the Supabase session from cookies and, if there
 * is no signed-in user, redirects to /login — preserving where they were headed
 * via ?next= so we can return them after sign-in.
 *
 * Public marketing pages are never matched, so they are untouched.
 */
export async function middleware(request: NextRequest) {
  // The response we may hand back — Supabase writes refreshed-session cookies
  // onto it, so it has to be the object we return.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run logic between createServerClient and getUser — getUser revalidates
  // the token and is the source of truth for "is this request authenticated".
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
