import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser (Client Components). Uses the public anon key;
 * Row Level Security enforces what each authenticated user can read/write.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
