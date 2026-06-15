"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function ProcessTimeline() {
  const { t } = useLanguage();
  const STEPS = t.method.steps;
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setOn(true), obs.disconnect())),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="process" className="relative overflow-hidden bg-white">
      <div className="orb animate-float-slow pointer-events-none absolute right-0 top-10 h-[320px] w-[320px] bg-slate-indigo/10" aria-hidden />
      <div ref={ref} className={`relative mx-auto max-w-container px-5 py-24 lg:px-8 ${on ? "process-on" : ""}`}>
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
            {t.method.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
            {t.method.title}
          </h2>
          <p className="mt-4 leading-relaxed text-steel">
            {t.method.body}
          </p>
        </div>

        {/* desktop horizontal timeline */}
        <div className="mt-16 hidden lg:block">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-cloud/70" />
            <div className="process-fill absolute left-0 right-0 top-[18px] h-[2px] bg-grad-brand-h" />
            <ol className="relative grid grid-cols-7 gap-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="process-node flex flex-col items-center text-center" style={{ transitionDelay: `${300 + i * 130}ms` }}>
                  <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-teal bg-white font-mono text-sm font-bold text-sapphire shadow-sm">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-sapphire">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-steel">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* mobile vertical timeline */}
        <ol className="mt-12 space-y-6 lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.t} className="process-node relative flex gap-4 pl-2" style={{ transitionDelay: `${200 + i * 90}ms` }}>
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-teal bg-white font-mono text-sm font-bold text-sapphire">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && <span className="mt-1 w-[2px] flex-1 bg-cloud" />}
              </div>
              <div className="pb-2">
                <h3 className="text-base font-semibold text-sapphire">{s.t}</h3>
                <p className="mt-1 text-sm leading-snug text-steel">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
