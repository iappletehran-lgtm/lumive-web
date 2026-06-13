import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * SERVER ONLY. The service-role key must never reach the browser, so this is
 * only ever imported by Server Components and Server Actions that have already
 * verified the caller is an admin (see requireRole in lib/auth.ts). Used for
 * admin-wide reads/writes that RLS deliberately blocks for normal users.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
