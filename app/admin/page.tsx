import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminConsole, type UserRow, type Booking } from "@/components/admin/AdminConsole";
import { BUSINESS_TZ } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireRole("admin");

  // Service-role reads — bypass RLS. Safe: requireRole("admin") proved the session.
  const admin = createAdminClient();
  const [{ data: usersData }, { data: bookingsData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, company, role, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("bookings")
      .select("id, full_name, email, selected_slot, payment_id, payment_status, booking_link, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const users = (usersData ?? []) as UserRow[];
  const bookings = (bookingsData ?? []) as Booking[];
  const counts = users.reduce(
    (acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }),
    {} as Record<string, number>
  );
  const open = bookings.filter(
    (b) => b.payment_status === "waiting" || b.payment_status === "confirming"
  ).length;

  return (
    <AdminConsole
      email={profile.email}
      users={users}
      bookings={bookings}
      counts={counts}
      open={open}
      businessTz={BUSINESS_TZ}
    />
  );
}
