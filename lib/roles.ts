/**
 * Roles and where each one lands after sign-in. Plain constants (no server-only
 * imports) so this is safe to use from both client and server components — the
 * single source of truth for role → home routing, shared by the login page,
 * the auth guards, and the dashboard redirects.
 */
export type Role = "prospect" | "client" | "admin";

export const HOME_FOR_ROLE: Record<Role, string> = {
  prospect: "/dashboard/welcome",
  client: "/dashboard",
  admin: "/admin",
};

export function homeForRole(role: string): string {
  return HOME_FOR_ROLE[role as Role] ?? "/dashboard/welcome";
}
