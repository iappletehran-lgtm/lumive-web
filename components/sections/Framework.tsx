"use client";

import { Reveal } from "../Reveal";
import { CTAButton } from "../CTA";
import { BOOK_URL } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Framework() {
  const { t } = useLanguage();
  return (
    <section id="framework" className="emerge-midnight relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-container px-5 py-24 lg:px-8 lg:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-lumive-light">
              {t.framework.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-mist lg:text-4xl">
              {t.framework.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-cloud/80">
              {t.framework.body}
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.framework.phases.map((p, i) => (
            <Reveal key={p.n} delay={i * 90}>
              <div data-tilt className="group relative h-full rounded-lg border border-white/10 bg-white/[0.03] p-6 transition-all duration-360 ease-enter hover:border-teal/40 hover:bg-white/[0.06]">
                {/* connector dot */}
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 font-mono text-sm font-bold text-lumive-light">
                    {p.n}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-cloud/60">
                    {p.weeks}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-mist">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-cloud/75">{p.body}</p>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-teal">
                    {t.framework.youGet}
                  </span>
                  <p className="mt-1 text-sm leading-snug text-cloud/85">{p.get}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-col items-start gap-5 rounded-lg border border-white/10 bg-white/[0.03] p-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-cloud/85">
              <span className="font-semibold text-mist">{t.framework.guaranteeLabel}</span>{" "}
              {t.framework.guarantee}
            </p>
            <CTAButton variant="primary" href={BOOK_URL} className="shrink-0">
              {t.framework.guaranteeCta}
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
