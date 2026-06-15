"use client";

import { Reveal } from "../Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function ValueProp() {
  const { t } = useLanguage();
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* left: the problem */}
          <Reveal>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                {t.problem.eyebrow}
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                {t.problem.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-steel">{t.problem.p1}</p>
              <p className="mt-4 text-lg leading-relaxed text-steel">{t.problem.p2}</p>
            </div>
          </Reveal>

          {/* right: what we do */}
          <Reveal delay={120}>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                {t.problem.buildEyebrow}
              </span>
              <div className="mt-6 space-y-4">
                {t.problem.items.map((item, i) => (
                  <div
                    key={item.t}
                    data-tilt
                    className="group flex gap-5 rounded-lg border border-cloud/70 bg-mist/40 p-6 transition-colors hover:border-teal/40 hover:bg-mist"
                  >
                    <span className="font-mono text-sm font-bold text-teal">0{i + 1}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-sapphire">{item.t}</h3>
                      <p className="mt-1.5 leading-relaxed text-steel">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* honesty block */}
        <Reveal delay={80}>
          <div className="mt-16 rounded-lg border-l-4 border-brass bg-mist/50 px-7 py-6">
            <p className="font-serif text-xl leading-relaxed text-sapphire lg:text-2xl">
              {t.problem.honesty}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
