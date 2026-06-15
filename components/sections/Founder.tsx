"use client";

import { Reveal } from "../Reveal";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";
import { BOOK_URL } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Founder() {
  const { t } = useLanguage();
  return (
    <section id="founder" className="bg-white">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          {/* portrait */}
          <Reveal>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-cloud/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/founder.jpg"
                  alt="Alireza Sharafeddin, Co-Founder of Lumive AI"
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </Reveal>

          {/* story */}
          <Reveal delay={120}>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                {t.founder.eyebrow}
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                {t.founder.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-steel">{t.founder.p1}</p>
              <p className="mt-4 text-lg leading-relaxed text-steel">{t.founder.p2}</p>

              <div className="mt-7 flex items-center gap-4 rounded-lg border border-cloud/70 bg-mist/40 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/founder.jpg"
                  alt="Alireza Sharafeddin"
                  className="h-12 w-12 shrink-0 rounded-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p className="font-semibold text-sapphire">{t.founder.name}</p>
                  <p className="text-sm text-steel">{t.founder.role}</p>
                </div>
              </div>

              <div className="mt-8">
                <CTAButton variant="primary" href={BOOK_URL}>
                  {t.common.bookACall}
                </CTAButton>
                <Reassurance className="mt-4" items={[...t.founder.reassure]} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
