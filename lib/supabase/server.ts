import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for the server (Server Components, Route Handlers, Server
 * Actions). Reads/writes the auth session from cookies. Uses the anon key under
 * Row Level Security — never the service-role key in user-facing requests.
 *
 * Next.js 14: cookies() is synchronous. The setAll try/catch is required because
 * cookies can only be written in a Server Action or Route Handler, not while
 * rendering a Server Component — there it safely no-ops.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* called from a Server Component render — safe to ignore */
          }
        },
      },
    }
  );
}
