import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminConsole, type UserRow, type Booking } from "@/components/admin/AdminConsole";
import type { ChatLogRow, ChatMessage } from "@/components/admin/ChatLogsSection";
import { BUSINESS_TZ } from "@/lib/booking";

export const dynamic = "force-dynamic";

type RawChatLog = {
  id: string;
  created_at: string;
  language: string | null;
  user_id: string | null;
  messages: ChatMessage[] | null;
};

export default async function AdminPage() {
  const profile = await requireRole("admin");

  // Service-role reads — bypass RLS. Safe: requireRole("admin") proved the session.
  const admin = createAdminClient();
  const [{ data: usersData }, { data: bookingsData }, { data: logsData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, company, role, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("bookings")
      .select("id, full_name, email, selected_slot, payment_id, payment_status, booking_link, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("chat_logs")
      .select("id, created_at, language, user_id, messages")
      .order("created_at", { ascending: false })
      .limit(1000),
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

  // chat_logs store user_id (auth.users) but not email — resolve emails via the
  // admin auth API and attach them. Guests (no user_id) map to null.
  const rawLogs = (logsData ?? []) as RawChatLog[];
  const emailById = new Map<string, string>();
  if (rawLogs.some((l) => l.user_id)) {
    try {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      for (const u of list?.users ?? []) if (u.email) emailById.set(u.id, u.email);
    } catch {
      /* email map best-effort — fall back to showing Guest */
    }
  }
  const chatLogs: ChatLogRow[] = rawLogs.map((l) => ({
    id: l.id,
    created_at: l.created_at,
    language: l.language === "fa" ? "fa" : "en",
    user_email: l.user_id ? emailById.get(l.user_id) ?? null : null,
    messages: Array.isArray(l.messages) ? l.messages : [],
  }));

  return (
    <AdminConsole
      email={profile.email}
      users={users}
      bookings={bookings}
      counts={counts}
      open={open}
      businessTz={BUSINESS_TZ}
      chatLogs={chatLogs}
    />
  );
}
