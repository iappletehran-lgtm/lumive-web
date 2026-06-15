"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { BookFlow } from "@/components/book/BookFlow";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Client wrapper for the /book page. It reads the active language (localStorage,
 * via LanguageContext) so the header, trust strip, and surrounding copy can be
 * bilingual. The page route itself stays a server component for its metadata.
 * Booking dates/times remain in the international (English-locale) format with
 * Western numerals per the brand rules.
 */
const TRUST_ICONS: ReactNode[] = [
  <path key="i0" d="M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />,
  <path key="i1" d="M3 7l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
];

export function BookContent() {
  const { t } = useLanguage();
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
          aria-label={t.book.logoLabel}
        >
          <Logo />
        </Link>

        {/* Header — no price here; it appears on the payment step */}
        <header className="text-center">
          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-sapphire sm:text-4xl">
            {t.book.title1}
            <span className="gradient-text">{t.book.titleBrand}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-steel sm:text-base">
            {t.book.subtitle}
          </p>
        </header>

        {/* Trust strip */}
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {t.book.trust.map((item, i) => (
            <li
              key={i}
              className="glass-tint flex items-start gap-3 rounded-xl border border-white/70 p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/12 text-teal">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{TRUST_ICONS[i]}</svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-sapphire">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-steel">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* The flow: time → details → payment → success */}
        <section className="glass-tint mt-6 rounded-2xl border border-white/70 p-7 shadow-lg sm:p-8">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-teal">
            {t.book.offer}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">{t.book.offerIntro}</p>
          <div className="mt-6">
            <BookFlow />
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-relaxed text-steel/60">
          {t.book.footerNote}
        </p>
      </div>
    </main>
  );
}
