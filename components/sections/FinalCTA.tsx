"use client";

import { Reveal } from "../Reveal";
import { PrismMark } from "../Logo";
import { CTAButton } from "../CTA";
import { Reassurance, FoundingNote } from "../Reassurance";
import { BOOK_URL } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function FinalCTA() {
  const { t } = useLanguage();
  return (
    <section id="book" className="emerge-sapphire-top relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-teal/15 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 py-28 text-center lg:px-8">
        <Reveal>
          <PrismMark className="mx-auto h-12 w-12" tone="dark" />
          <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight text-mist lg:text-[2.75rem]">
            {t.finalCta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cloud/85">
            {t.finalCta.body}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTAButton variant="primary" size="lg" href={BOOK_URL}>
              {t.common.bookACall}
            </CTAButton>
            <CTAButton variant="secondary" size="lg" tone="dark" href="#readiness">
              {t.finalCta.secondary}
            </CTAButton>
          </div>
          <Reassurance tone="dark" className="mt-6 justify-center" items={[...t.finalCta.reassure]} />
          <div className="mt-7 flex justify-center">
            <FoundingNote tone="dark" />
          </div>
          <p className="mt-8 font-serif text-lg text-cloud/70">{t.finalCta.tagline}</p>
        </Reveal>
      </div>
    </section>
  );
}
