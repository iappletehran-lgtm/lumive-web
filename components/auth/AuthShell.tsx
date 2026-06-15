import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/**
 * Shared layout for the auth pages (login / register). A single centred card on
 * the brand canvas — same glass-tint surface, eyebrow + display heading, and
 * mesh/dot-grid backdrop the marketing pages use, so auth feels native to the
 * site rather than a bolted-on screen. Presentational only; the forms inside are
 * the client components.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  logoLabel = "Lumive AI — home",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  logoLabel?: string;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-14">
      {/* Brand backdrop — same layers as the hero, held behind content */}
      <div className="mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative w-full max-w-[440px]">
        <Link
          href="/"
          prefetch={false}
          data-sound="nav"
          className="focus-brand mx-auto mb-8 flex w-fit items-center justify-center rounded-md"
          aria-label={logoLabel}
        >
          <Logo />
        </Link>

        <div className="glass-tint rounded-2xl border border-white/70 p-8 shadow-lg sm:p-9">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
            {eyebrow}
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-sapphire">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[15px] leading-relaxed text-steel">{subtitle}</p>
          )}
          <div className="mt-7">{children}</div>
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-steel">{footer}</p>
        )}
      </div>
    </main>
  );
}

/**
 * One labelled input, styled to match the contact-form fields exactly
 * (mono uppercase label, soft cloud border, white-on-focus, sapphire ring).
 */
export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = false,
  optional = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={`a-${name}`}
        className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel"
      >
        {label}
        {optional && (
          <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-steel/60">
            Optional
          </span>
        )}
      </label>
      <input
        id={`a-${name}`}
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
