/**
 * Server-side auth guards. SERVER ONLY — imports the cookie-bound Supabase client
 * and next/navigation redirect, so only use this from Server Components, Route
 * Handlers, and Server Actions (never a "use client" file).
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, type Role } from "@/lib/roles";

export type Profile = {
  id: string;
  full_name: string | null;
  company: string | null;
  role: Role;
  created_at: string;
  email?: string;
};

const PROFILE_COLUMNS = "id, full_name, company, role, created_at";

/** The signed-in user's profile (with email), or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (data) {
    return { ...(data as Omit<Profile, "email">), email: user.email ?? undefined };
  }

  // No profile row yet — normally the on_auth_user_created trigger creates one at
  // sign-up, but if it didn't run (e.g. the account predates the trigger) an
  // authenticated user would otherwise be bounced back to /login forever. Self-heal
  // by creating the default prospect profile from the sign-up metadata. RLS
  // (profiles_insert_own: auth.uid() = id) allows the user to insert their own row.
  const meta = (user.user_metadata ?? {}) as { full_name?: string; company?: string };
  await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: meta.full_name?.trim() || null,
      company: meta.company?.trim() || null,
      role: "prospect",
    })
    .then(
      () => undefined,
      () => undefined, // swallow — a concurrent request may have created it first
    );

  const { data: healed } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (!healed) return null;

  return { ...(healed as Omit<Profile, "email">), email: user.email ?? undefined };
}

/**
 * Gate a page to a single role. Redirects to /login if signed out, or to the
 * user's own home if they are signed in but with the wrong role. Returns the
 * profile so the page can render it.
 */
export async function requireRole(role: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(homeForRole(profile.role));
  return profile;
}
