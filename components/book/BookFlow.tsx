"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyField } from "./CopyField";
import { WeekCalendar } from "./WeekCalendar";
import type { PaymentStatus } from "@/lib/booking";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Payment = {
  payment_id: string;
  pay_address: string;
  pay_amount: number | string;
  pay_currency: string;
  payment_status: PaymentStatus;
  qr: string;
  network: string;
  amount_usd: string;
  selected_slot: string;
};

type Step = "time" | "details" | "payment";
const POLL_MS = 10_000;

/**
 * The /book checkout. Four calm steps — pick a time, add your details, pay, done.
 * Price appears for the first time on the payment step. After NOWPayments
 * confirms (webhook/poll), the server creates the Cal.com booking and emails the
 * meeting link; this page flips to the success state on its own.
 */
export function BookFlow() {
  const { t } = useLanguage();
  const tz = useMemo(
    () => (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC",
    []
  );

  const [step, setStep] = useState<Step>("time");
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("waiting");

  const slotLabel = (iso: string) =>
    `${new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz })} · ${new Date(
      iso
    ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })}`;

  async function onSubmitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (data.website) return; // honeypot
    if (!slot) {
      setStep("time");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, selected_slot: slot }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok || !json.payment) {
        throw new Error(json.error || t.book.paymentStartError);
      }
      setEmail((data.email || "").trim());
      setPayment(json.payment as Payment);
      setStatus((json.payment.payment_status as PaymentStatus) || "waiting");
      setStep("payment");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Poll for status while on the payment step and not yet settled.
  useEffect(() => {
    if (step !== "payment" || !payment) return;
    if (status === "confirmed" || status === "failed") return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/payment-status?id=${encodeURIComponent(payment.payment_id)}`);
        const json = await res.json().catch(() => ({}));
        if (json?.payment_status) setStatus(json.payment_status as PaymentStatus);
      } catch {
        /* transient — retry next tick */
      }
    };
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [step, payment, status]);

  // ── Success ────────────────────────────────────────────────
  if (step === "payment" && status === "confirmed") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal">
          ✓
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-sapphire">{t.book.bookedTitle}</h2>
        {slot && (
          <p className="mt-2 font-mono text-[13px] uppercase tracking-wide text-teal">{slotLabel(slot)}</p>
        )}
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-steel">
          {email ? (
            <>
              {t.book.successEmailPre}
              <span className="font-medium text-midnight" dir="ltr">{email}</span>
              {t.book.successEmailPost}
            </>
          ) : (
            t.book.successNoEmail
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Stepper step={step} />

      {/* ── Step 1: time ─────────────────────────────────────── */}
      {step === "time" && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-sapphire">{t.book.pickTimeTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-steel">{t.book.pickTimeBody}</p>
          <div className="mt-5">
            <WeekCalendar
              timeZone={tz}
              onPick={(iso) => {
                setSlot(iso);
                setStep("details");
              }}
            />
          </div>
        </div>
      )}

      {/* ── Step 2: details ──────────────────────────────────── */}
      {step === "details" && (
        <div className="mt-6">
          <SlotReminder label={slot ? slotLabel(slot) : ""} onChange={() => setStep("time")} />
          <h2 className="mt-6 text-lg font-semibold text-sapphire">{t.book.yourDetails}</h2>
          <form className="mt-4 space-y-5" onSubmit={onSubmitDetails} noValidate>
            <Field label={t.book.fullName} name="full_name" placeholder={t.book.fullNamePlaceholder} autoComplete="name" required />
            <Field label={t.book.emailLabel} name="email" type="email" placeholder={t.book.emailPlaceholder} autoComplete="email" required />

            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            {error && (
              <p role="alert" className="text-sm text-ember">
                {error}
              </p>
            )}

            <button
              type="submit"
              data-sound="cta"
              disabled={submitting}
              className="focus-brand glow-cta w-full rounded-md bg-brass px-6 py-3.5 text-base font-semibold text-midnight shadow-md transition-all hover:brightness-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? t.book.preparingPayment : t.book.continue}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 3: payment ──────────────────────────────────── */}
      {step === "payment" && payment && (
        <div className="mt-6">
          {slot && <SlotReminder label={slotLabel(slot)} />}

          {/* first time price is shown */}
          <div className="mt-5 flex items-baseline justify-between rounded-md border border-cloud/70 bg-white/60 px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-wide text-steel">{t.book.total}</span>
            <span className="text-lg font-semibold text-sapphire" dir="ltr">${payment.amount_usd} USDT</span>
          </div>

          <div className="mt-5">
            <StatusIndicator status={status} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-md bg-white/70 px-3 py-1.5 font-mono text-xs text-steel">
              {t.book.send} <span className="ml-1 font-semibold text-midnight" dir="ltr">{payment.pay_amount} USDT</span>
            </span>
            <span className="rounded-md bg-white/70 px-3 py-1.5 font-mono text-xs text-steel">
              {t.book.network} <span className="ml-1 font-semibold text-midnight" dir="ltr">{payment.network}</span>
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-xl border border-cloud bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={payment.qr} alt={t.book.qrAlt} className="h-44 w-44" />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-steel/70">{t.book.scanToPay}</p>
          </div>

          <div className="mt-6">
            <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
              {t.book.orSendAddress}
            </p>
            <CopyField value={payment.pay_address} ariaLabel={t.book.copyAddressAria} />
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-md border border-ember/30 bg-ember/8 p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-ember" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
            <p className="text-sm leading-relaxed text-midnight">
              <strong className="font-bold">{t.book.warnStrong}</strong>{t.book.warnRest}
            </p>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-steel/70">
            {t.book.autoUpdateNote}
          </p>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const { t } = useLanguage();
  const items: { key: Step; label: string }[] = [
    { key: "time", label: t.book.stepTime },
    { key: "details", label: t.book.stepDetails },
    { key: "payment", label: t.book.stepPayment },
  ];
  const order: Step[] = ["time", "details", "payment"];
  const current = order.indexOf(step);
  return (
    <ol className="flex items-center gap-2">
      {items.map((it, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={it.key} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                done ? "bg-teal text-white" : active ? "bg-sapphire text-mist" : "bg-cloud/50 text-steel/60",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`font-mono text-[10px] uppercase tracking-wide ${active ? "text-sapphire" : "text-steel/60"}`}>
              {it.label}
            </span>
            {i < items.length - 1 && <span className={`mx-1 hidden h-px flex-1 sm:block ${done ? "bg-teal" : "bg-cloud"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function SlotReminder({ label, onChange }: { label: string; onChange?: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-teal/25 bg-teal/[0.06] px-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wide text-teal">{t.book.yourSession}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-midnight" dir="ltr">{label || "—"}</p>
      </div>
      {onChange && (
        <button
          type="button"
          onClick={onChange}
          data-sound="nav"
          className="focus-brand shrink-0 rounded border border-sapphire/20 bg-white/70 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-sapphire transition-colors hover:bg-white"
        >
          {t.book.change}
        </button>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: PaymentStatus }) {
  const { t } = useLanguage();
  const map: Record<PaymentStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
    waiting: { label: t.book.statusWaiting, dot: "bg-brass", text: "text-[#8a6d1f]", pulse: true },
    confirming: { label: t.book.statusConfirming, dot: "bg-slate-indigo", text: "text-slate-indigo", pulse: true },
    confirmed: { label: t.book.statusConfirmed, dot: "bg-teal", text: "text-teal", pulse: false },
    failed: { label: t.book.statusFailed, dot: "bg-ember", text: "text-ember", pulse: false },
  };
  const s = map[status];
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-md border border-cloud/70 bg-white/60 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5">
        {s.pulse && <span className={`absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-60 motion-safe:animate-ping`} />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
      </span>
      <span className={`font-mono text-xs font-medium uppercase tracking-wide ${s.text}`}>{s.label}</span>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`b-${name}`} className="font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
        {label}
      </label>
      <input
        id={`b-${name}`}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
      />
    </div>
  );
}
