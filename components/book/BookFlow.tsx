"use client";

import { useEffect, useState } from "react";
import { CopyField } from "./CopyField";
import type { PaymentStatus } from "@/lib/booking";

type Payment = {
  payment_id: string;
  pay_address: string;
  pay_amount: number | string;
  pay_currency: string;
  payment_status: PaymentStatus;
  qr: string; // data URL
  network: string;
  amount_usd: string;
};

const POLL_MS = 10_000;

/**
 * The /book checkout. Three calm steps in one card:
 *   form → payment (QR + address + live status) → success.
 * Status is polled from /api/payment-status every 10s until confirmed/failed.
 */
export function BookFlow() {
  const [step, setStep] = useState<"form" | "payment">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("waiting");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (data.website) return; // honeypot

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok || !json.payment) {
        throw new Error(json.error || "Could not start the payment. Please try again.");
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
        /* transient — try again next tick */
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
        <h2 className="mt-5 text-2xl font-semibold text-sapphire">Payment confirmed</h2>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-steel">
          Check your email for your booking link
          {email ? (
            <>
              {" "}— we sent it to <span className="font-medium text-midnight">{email}</span>
            </>
          ) : null}
          . If it is not there in a few minutes, check spam or reply to us.
        </p>
      </div>
    );
  }

  // ── Payment ────────────────────────────────────────────────
  if (step === "payment" && payment) {
    return (
      <div>
        <StatusIndicator status={status} />

        {/* amount / network */}
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-md bg-white/70 px-3 py-1.5 font-mono text-xs text-steel">
            Send{" "}
            <span className="ml-1 font-semibold text-midnight">
              {payment.pay_amount} USDT
            </span>
          </span>
          <span className="rounded-md bg-white/70 px-3 py-1.5 font-mono text-xs text-steel">
            Network <span className="ml-1 font-semibold text-midnight">{payment.network}</span>
          </span>
        </div>

        {/* QR */}
        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-xl border border-cloud bg-white p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.qr} alt="Payment QR code" className="h-44 w-44" />
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-steel/70">
            Scan to pay
          </p>
        </div>

        {/* address */}
        <div className="mt-6">
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
            Or send to this address
          </p>
          <CopyField value={payment.pay_address} ariaLabel="Copy payment address" />
        </div>

        {/* network warning */}
        <div className="mt-6 flex items-start gap-3 rounded-md border border-ember/30 bg-ember/8 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-ember" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
          <p className="text-sm leading-relaxed text-midnight">
            <strong className="font-bold">Send only USDT on the TRC20 network.</strong> Any other
            token or network means the funds cannot be recovered.
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-steel/70">
          This page updates on its own once your transfer lands. You can keep it open — your
          booking link is emailed automatically the moment payment is confirmed.
        </p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" placeholder="Your name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
      </div>

      <div>
        <label htmlFor="b-times" className="font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
          Preferred time slots
        </label>
        <textarea
          id="b-times"
          name="preferred_times"
          rows={3}
          placeholder="e.g. Weekday mornings (CET), or Tue/Thu afternoons — a couple of options is plenty."
          className="mt-2 w-full resize-none rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
        />
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

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
        {submitting ? "Starting payment…" : "Proceed to Payment"}
      </button>

      <p className="text-center text-xs leading-relaxed text-steel/70">
        Payment is verified automatically. No account needed.
      </p>
    </form>
  );
}

/** Live status row with a calm pulse while waiting/confirming. */
function StatusIndicator({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
    waiting: { label: "Waiting for payment…", dot: "bg-brass", text: "text-[#8a6d1f]", pulse: true },
    confirming: { label: "Confirming…", dot: "bg-slate-indigo", text: "text-slate-indigo", pulse: true },
    confirmed: { label: "Confirmed", dot: "bg-teal", text: "text-teal", pulse: false },
    failed: { label: "Payment failed — please try again", dot: "bg-ember", text: "text-ember", pulse: false },
  };
  const s = map[status];
  return (
    <div className="flex items-center justify-center gap-2.5 rounded-md border border-cloud/70 bg-white/60 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5">
        {s.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-60 motion-safe:animate-ping`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
      </span>
      <span className={`font-mono text-xs font-medium uppercase tracking-wide ${s.text}`}>
        {s.label}
      </span>
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
