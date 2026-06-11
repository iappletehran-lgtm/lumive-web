"use client";

import { useState } from "react";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";
import { BOOKING_URL } from "@/lib/contact";

type Status = "idle" | "submitting" | "error";

/**
 * Contact-form lead capture (name, email, message). Posts to /api/contact, which
 * forwards or stores the lead. Booking stays on Cal.com — the "Pick a time" link
 * below is the primary booking path; this form is the "send a message" option.
 * Markup and styling are unchanged from the original card — only behaviour added.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Something went wrong. Please try again or book a time.");
      }
      setDone(true);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (done) {
    return (
      <div className="glass-tint rounded-2xl border border-white/70 p-7 text-center shadow-lg lg:p-9">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-xl text-teal">
          ✓
        </span>
        <h3 className="mt-5 text-xl font-semibold text-sapphire">Thank you — message received.</h3>
        <p className="mt-2 leading-relaxed text-steel">
          We reply within one business day. If you would rather not wait, you can book a time now.
        </p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-sound="cta"
          className="focus-brand glow-cta mt-6 inline-flex items-center justify-center rounded-md bg-brass px-6 py-3 font-semibold text-midnight shadow-md transition-all hover:brightness-95"
        >
          Book a 30-minute call
        </a>
      </div>
    );
  }

  return (
    <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-9">
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <p className="text-sm text-steel/80">Two details to start — the rest is optional.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" name="name" placeholder="Your name" required />
          <Field label="Work email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <Field label="Company" name="company" placeholder="Company name" optional />
        <div>
          <label htmlFor="c-msg" className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
            What are you trying to solve?
            <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-steel/60">
              Optional
            </span>
          </label>
          <textarea
            id="c-msg"
            name="message"
            rows={3}
            placeholder="A sentence is plenty — or leave it and we will ask on the call."
            className="mt-2 w-full resize-none rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
          />
        </div>

        {/* honeypot — visually hidden, off-screen; bots fill it, humans never do */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          data-sound="cta"
          disabled={status === "submitting"}
          className="focus-brand w-full rounded-md bg-brass px-6 py-3.5 text-base font-semibold text-midnight shadow-md transition-all hover:brightness-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>

        {status === "error" && (
          <p role="alert" className="text-center text-sm text-ember">
            {error}
          </p>
        )}

        <Reassurance
          className="justify-center"
          items={["Takes under a minute", "No spam", "We never share your details"]}
        />

        <div className="flex items-center gap-3 text-steel/50">
          <span className="h-px flex-1 bg-cloud" />
          <span className="font-mono text-[11px] uppercase tracking-wide">or</span>
          <span className="h-px flex-1 bg-cloud" />
        </div>

        {/* Primary booking path — opens the Cal.com scheduling page */}
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-sound="cta"
          className="focus-brand glow-cta flex items-center justify-center gap-2 rounded-md bg-sapphire px-6 py-3.5 text-base font-semibold text-mist transition-all hover:brightness-110"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
          Book a 30-minute call
        </a>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  optional = false,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`c-${name}`} className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
        {label}
        {optional && (
          <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-steel/60">
            Optional
          </span>
        )}
      </label>
      <input
        id={`c-${name}`}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
      />
    </div>
  );
}
