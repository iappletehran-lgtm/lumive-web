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

/** The signed-in user's profile (with email), or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, company, role, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return { ...(data as Omit<Profile, "email">), email: user.email ?? undefined };
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
