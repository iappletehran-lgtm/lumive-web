import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BookFlow } from "@/components/book/BookFlow";
import { PAYMENT } from "@/lib/booking";

export const metadata: Metadata = {
  title: "Book a Strategy Call — Lumive AI",
  description:
    "Pick a time for a 30-minute AI strategy call with Lumive AI. Payment is verified automatically and your meeting link arrives by email within minutes.",
};

const TRUST = [
  {
    title: "Verified automatically",
    body: "No manual checks — the moment your transfer confirms on-chain, your booking unlocks.",
    icon: (
      <path d="M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
    ),
  },
  {
    title: "Link by email in minutes",
    body: "Your Cal.com booking link is sent as soon as payment is confirmed.",
    icon: <path d="M3 7l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  },
];

export default function BookPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-12 sm:py-16">
      <div className="mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-[560px]">
        <Link
          href="/"
          prefetch={false}
          data-sound="nav"
          className="focus-brand mx-auto mb-9 flex w-fit items-center justify-center rounded-md"
          aria-label="Lumive AI — home"
        >
          <Logo />
        </Link>

        {/* Header — no price here; it appears on the payment step */}
        <header className="text-center">
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-sapphire sm:text-4xl">
            Book a <span className="gradient-text">Strategy Call.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-steel sm:text-base">
            Pick a time that works for you. Payment is the last step, verified automatically — your
            meeting link arrives within minutes.
          </p>
        </header>

        {/* Trust strip */}
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {TRUST.map((t) => (
            <li
              key={t.title}
              className="glass-tint flex items-start gap-3 rounded-xl border border-white/70 p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/12 text-teal">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-sapphire">{t.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-steel">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* The flow: form → payment → success */}
        <section className="glass-tint mt-6 rounded-2xl border border-white/70 p-7 shadow-lg sm:p-8">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-teal">
            {PAYMENT.offer}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">
            Pick a time, add your details, and confirm. Payment is the final step.
          </p>
          <div className="mt-6">
            <BookFlow />
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-relaxed text-steel/60">
          Payments are in USDT on the TRC20 network, handled securely by NOWPayments. Need help?
          Reach us on the channels in the site footer.
        </p>
      </div>
    </main>
  );
}
