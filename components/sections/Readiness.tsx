"use client";

import { useState } from "react";
import { PrismMark } from "../Logo";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";
import { BOOK_URL } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Scoring stays here (language-independent); questions/options come from translations.
const SCORES = [
  [0, 1, 2],
  [0, 1, 2],
  [1, 1, 2],
  [0, 1, 2],
];

function resultIndex(score: number): number {
  if (score <= 3) return 0;
  if (score <= 6) return 1;
  return 2;
}

export function Readiness() {
  const { t } = useLanguage();
  const QUESTIONS = t.readiness.questions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const total = QUESTIONS.length;
  const done = step >= total;
  const score = answers.reduce((a, b) => a + b, 0);
  const result = done ? t.readiness.results[resultIndex(score)] : null;

  const choose = (s: number) => {
    setAnswers((prev) => [...prev, s]);
    setStep((v) => v + 1);
  };
  const reset = () => {
    setAnswers([]);
    setStep(0);
  };

  return (
    <section id="readiness" className="relative bg-mist">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* intro */}
          <div>
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
              {t.readiness.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
              {t.readiness.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-steel">{t.readiness.intro}</p>
            <ul className="mt-6 space-y-2.5 text-steel">
              {t.readiness.bullets.map((li) => (
                <li key={li} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/15 text-xs text-teal">
                    ✓
                  </span>
                  {li}
                </li>
              ))}
            </ul>
          </div>

          {/* interactive card */}
          <div className="relative rounded-[20px] border border-cloud/70 bg-white p-7 shadow-lg lg:p-9">
            {/* progress */}
            <div className="mb-7 flex items-center gap-3">
              <PrismMark className="h-6 w-6" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cloud/60">
                <div
                  className="h-full rounded-full bg-grad-brand-h transition-all duration-500 ease-brand"
                  style={{ width: `${(Math.min(step, total) / total) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-steel">
                {Math.min(step, total)}/{total}
              </span>
            </div>

            {!done ? (
              <div key={step} className="animate-fade-up">
                <p className="font-mono text-[11px] uppercase tracking-wide text-teal">
                  {t.readiness.questionLabel} {step + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-sapphire">
                  {QUESTIONS[step].q}
                </h3>
                <div className="mt-6 space-y-3">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => choose(SCORES[step][i])}
                      data-sound="click"
                      className="focus-brand group flex w-full items-center justify-between rounded-md border border-cloud bg-mist/40 px-5 py-4 text-start font-medium text-midnight transition-all duration-200 ease-brand hover:border-teal hover:bg-mist"
                    >
                      {opt}
                      <span className="text-cloud transition-colors group-hover:text-teal" aria-hidden>
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-teal">
                  {t.readiness.yourResult}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-sapphire">{result!.title}</h3>
                <p className="mt-3 leading-relaxed text-steel">{result!.body}</p>
                <p className="mt-4 rounded-md border-l-2 border-brass bg-mist/50 px-4 py-3 text-sm font-medium text-sapphire">
                  {result!.step}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <CTAButton variant="primary" href={BOOK_URL} className="flex-1">
                    {t.common.bookACall}
                  </CTAButton>
                  <CTAButton variant="secondary" onClick={reset}>
                    {t.common.startOver}
                  </CTAButton>
                </div>
                <Reassurance className="mt-4" items={[...t.readiness.reassure]} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
