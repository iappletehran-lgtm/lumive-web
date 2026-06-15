"use client";

import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { promoteToClient, saveBookingLink, resendBookingEmail } from "@/app/admin/actions";
import { formatSlot, type PaymentStatus } from "@/lib/booking";
import type { Role } from "@/lib/roles";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type UserRow = {
  id: string;
  full_name: string | null;
  company: string | null;
  role: Role;
  created_at: string;
};

export type Booking = {
  id: string;
  full_name: string | null;
  email: string | null;
  selected_slot: string | null;
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
  // International date format with Western numerals, per the brand rules.
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Client view for /admin. The page route does the admin-guarded service-role
 * reads server-side and passes the rows here so the copy can read the active
 * language (localStorage, via LanguageContext). Server actions are imported
 * directly and used as <form action>. IDs, payment IDs, dates and the Cal link
 * stay in their original LTR/Latin form.
 */
export function AdminConsole({
  email,
  users,
  bookings,
  counts,
  open,
  businessTz,
}: {
  email?: string;
  users: UserRow[];
  bookings: Booking[];
  counts: Record<string, number>;
  open: number;
  businessTz: string;
}) {
  const { t } = useLanguage();

  const accountWord = users.length === 1 ? t.admin.account : t.admin.accounts;
  const bookingWord = bookings.length === 1 ? t.admin.booking : t.admin.bookings;
  const subtitle =
    `${users.length} ${accountWord} · ${bookings.length} ${bookingWord}` +
    (open ? ` (${open} ${t.admin.awaitingPayment})` : "");

  return (
    <DashboardShell
      logoLabel={t.admin.logoLabel}
      eyebrow={t.admin.eyebrow}
      title={t.admin.title}
      subtitle={subtitle}
      email={email}
    >
      <div className="space-y-12">
        {/* ── People ─────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-sapphire">{t.admin.people}</h2>
            <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
              {counts.prospect ?? 0} {t.admin.roles.prospect} · {counts.client ?? 0} {t.admin.roles.client} · {counts.admin ?? 0} {t.admin.roles.admin}
            </span>
          </div>

          <div className="glass-tint overflow-hidden rounded-2xl border border-white/70 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                    <Th>{t.admin.thName}</Th>
                    <Th>{t.admin.thCompany}</Th>
                    <Th>{t.admin.thRole}</Th>
                    <Th>{t.admin.thJoined}</Th>
                    <Th className="text-end">{t.admin.thAction}</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-steel/60">
                        {t.admin.noAccounts}
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
                            {t.admin.roles[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">
                          {fmtDate(u.created_at)}
                        </td>
                        <td className="px-5 py-4 text-end">
                          {u.role === "prospect" ? (
                            <form action={promoteToClient}>
                              <input type="hidden" name="id" value={u.id} />
                              <button
                                type="submit"
                                data-sound="nav"
                                className="focus-brand rounded-md border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal transition-all hover:bg-teal hover:text-white"
                              >
                                {t.admin.promote}
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
            <h2 className="text-lg font-semibold text-sapphire">{t.admin.bookingsTitle}</h2>
            <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
              {t.admin.bookingsHint}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="glass-tint rounded-2xl border border-white/70 p-10 text-center shadow-lg">
              <p className="text-sm text-steel/70">
                {t.admin.noBookingsPre}
                <span className="font-mono text-steel" dir="ltr">/book</span>
                {t.admin.noBookingsPost}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((b) => (
                <BookingCard key={b.id} booking={b} businessTz={businessTz} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function BookingCard({ booking: b, businessTz }: { booking: Booking; businessTz: string }) {
  const { t } = useLanguage();
  const confirmed = b.payment_status === "confirmed";
  return (
    <article className="glass-tint rounded-2xl border border-white/70 p-6 shadow-lg sm:p-7">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-sapphire">{b.full_name || t.admin.unnamed}</p>
          <p className="truncate text-sm text-steel" dir="ltr">{b.email || "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[b.payment_status]}`}
          >
            {t.admin.status[b.payment_status]}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70" dir="ltr">
            {fmtDate(b.created_at)}
          </span>
        </div>
      </div>

      {/* details */}
      <dl className="mt-5 space-y-4 border-t border-cloud/60 pt-5">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">
            {t.admin.nowpaymentsId}
          </dt>
          <dd className="mt-1 break-all font-mono text-[13px] text-midnight" dir="ltr">
            {b.payment_id || "—"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">
            {t.admin.session} ({businessTz.replace(/_/g, " ")})
          </dt>
          <dd className="mt-1 text-sm font-medium leading-relaxed text-midnight" dir="ltr">
            {b.selected_slot ? formatSlot(b.selected_slot, businessTz) : <span className="font-normal text-steel/40">—</span>}
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
              {t.admin.calLink}
            </label>
            <input
              id={`link-${b.id}`}
              name="booking_link"
              type="url"
              defaultValue={b.booking_link ?? ""}
              placeholder={t.admin.calLinkPlaceholder}
              dir="ltr"
              className="mt-1.5 w-full rounded-md border border-cloud bg-white/70 px-3 py-2 text-sm text-midnight placeholder:text-steel/45 focus:border-sapphire focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="submit"
              data-sound="nav"
              className="focus-brand shrink-0 rounded-md border border-sapphire/25 bg-white/60 px-4 py-2 text-sm font-semibold text-sapphire transition-all hover:bg-white"
            >
              {t.admin.saveLink}
            </button>
            {confirmed && (
              <button
                type="submit"
                formAction={resendBookingEmail}
                formNoValidate
                data-sound="cta"
                className="focus-brand shrink-0 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110"
              >
                {t.admin.resendEmail}
              </button>
            )}
          </div>
        </form>
        {confirmed && (
          <p className="mt-3 font-mono text-[11px] text-steel/70">
            {b.booking_link ? (
              <>
                {t.admin.linkLabel}{" "}
                <a
                  href={b.booking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="text-sapphire underline-offset-2 hover:underline"
                >
                  {b.booking_link}
                </a>
              </>
            ) : (
              t.admin.confirmedDefault
            )}
          </p>
        )}
      </div>
    </article>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-3.5 font-medium ${className}`}>{children}</th>;
}
