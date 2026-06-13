import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { promoteToClient, saveBookingLink, resendBookingEmail } from "./actions";
import { STATUS_LABEL, type PaymentStatus } from "@/lib/booking";
import type { Role } from "@/lib/roles";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  full_name: string | null;
  company: string | null;
  role: Role;
  created_at: string;
};

type Booking = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_times: string | null;
  payment_id: string | null;
  payment_status: PaymentStatus;
  booking_link: string | null;
  created_at: string;
};

const ROLE_STYLE: Record<Role, string> = {
  prospect: "bg-steel/10 text-steel",
  client: "bg-teal/12 text-teal",
  admin: "bg-sapphire/10 text-sapphire",
};

const STATUS_STYLE: Record<PaymentStatus, string> = {
  waiting: "bg-brass/15 text-[#8a6d1f]",
  confirming: "bg-slate-indigo/15 text-slate-indigo",
  confirmed: "bg-teal/12 text-teal",
  failed: "bg-ember/12 text-ember",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
      .select("id, full_name, email, preferred_times, payment_id, payment_status, booking_link, created_at")
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
    <DashboardShell
      eyebrow="Admin"
      title="Console"
      subtitle={`${users.length} ${users.length === 1 ? "account" : "accounts"} · ${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"}${open ? ` (${open} awaiting payment)` : ""}`}
      email={profile.email}
    >
      <div className="space-y-12">
        {/* ── People ─────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-sapphire">People</h2>
            <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
              {counts.prospect ?? 0} prospect · {counts.client ?? 0} client · {counts.admin ?? 0} admin
            </span>
          </div>

          <div className="glass-tint overflow-hidden rounded-2xl border border-white/70 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                    <Th>Name</Th>
                    <Th>Company</Th>
                    <Th>Role</Th>
                    <Th>Joined</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-steel/60">
                        No accounts yet.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-white/40">
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-midnight">
                            {u.full_name || <span className="text-steel/50">—</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-steel">
                          {u.company || <span className="text-steel/40">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${ROLE_STYLE[u.role]}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-steel/80">
                          {fmtDate(u.created_at)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {u.role === "prospect" ? (
                            <form action={promoteToClient}>
                              <input type="hidden" name="id" value={u.id} />
                              <button
                                type="submit"
                                data-sound="nav"
                                className="focus-brand rounded-md border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal transition-all hover:bg-teal hover:text-white"
                              >
                                Promote to client
                              </button>
                            </form>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-wide text-steel/40">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Bookings ───────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-sapphire">Bookings</h2>
            <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
              Status updates automatically · reload to refresh
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="glass-tint rounded-2xl border border-white/70 p-10 text-center shadow-lg">
              <p className="text-sm text-steel/70">
                No bookings yet. Paid consultations from{" "}
                <span className="font-mono text-steel">/book</span> appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const confirmed = b.payment_status === "confirmed";
  return (
    <article className="glass-tint rounded-2xl border border-white/70 p-6 shadow-lg sm:p-7">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-sapphire">{b.full_name || "Unnamed"}</p>
          <p className="truncate text-sm text-steel">{b.email || "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[b.payment_status]}`}
          >
            {STATUS_LABEL[b.payment_status]}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
            {fmtDate(b.created_at)}
          </span>
        </div>
      </div>

      {/* details */}
      <dl className="mt-5 space-y-4 border-t border-cloud/60 pt-5">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">
            NOWPayments ID
          </dt>
          <dd className="mt-1 break-all font-mono text-[13px] text-midnight">
            {b.payment_id || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">
            Preferred times
          </dt>
          <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-steel">
            {b.preferred_times || <span className="text-steel/40">—</span>}
          </dd>
        </div>
      </dl>

      {/* Cal.com link — manual, optional. Confirmation/email are automatic. */}
      <div className="mt-5 border-t border-cloud/60 pt-5">
        <form action={saveBookingLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="id" value={b.id} />
          <div className="flex-1">
            <label
              htmlFor={`link-${b.id}`}
              className="font-mono text-[10px] uppercase tracking-wide text-steel"
            >
              Cal.com booking link
            </label>
            <input
              id={`link-${b.id}`}
              name="booking_link"
              type="url"
              defaultValue={b.booking_link ?? ""}
              placeholder="https://cal.com/lumive-90min/…  (defaults to the standard link)"
              className="mt-1.5 w-full rounded-md border border-cloud bg-white/70 px-3 py-2 text-sm text-midnight placeholder:text-steel/45 focus:border-sapphire focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="submit"
              data-sound="nav"
              className="focus-brand shrink-0 rounded-md border border-sapphire/25 bg-white/60 px-4 py-2 text-sm font-semibold text-sapphire transition-all hover:bg-white"
            >
              Save link
            </button>
            {confirmed && (
              <button
                type="submit"
                formAction={resendBookingEmail}
                formNoValidate
                data-sound="cta"
                className="focus-brand shrink-0 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
              >
                Resend booking email
              </button>
            )}
          </div>
        </form>
        {confirmed && (
          <p className="mt-3 font-mono text-[11px] text-steel/70">
            {b.booking_link ? (
              <>
                Link:{" "}
                <a
                  href={b.booking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sapphire underline-offset-2 hover:underline"
                >
                  {b.booking_link}
                </a>
              </>
            ) : (
              "Confirmed — the standard Cal.com link was emailed. Set a custom link above to override."
            )}
          </p>
        )}
      </div>
    </article>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3.5 font-medium ${className}`}>{children}</th>;
}
