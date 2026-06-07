"use client";

import { useState } from "react";
import { PrismMark } from "../Logo";
import { PlaceholderTag } from "../Placeholder";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";

const QUESTIONS = [
  {
    q: "How much of your team's work is repetitive and rule-based?",
    options: ["Very little", "Some of it", "A large share"],
    scores: [0, 1, 2],
  },
  {
    q: "How accessible is your business data today?",
    options: ["Scattered / manual", "In a few systems", "Centralised and clean"],
    scores: [0, 1, 2],
  },
  {
    q: "Have you tried adopting AI before?",
    options: ["Not yet", "Tried, it stalled", "Yes, with some success"],
    scores: [1, 1, 2],
  },
  {
    q: "How clear is the problem you want AI to solve?",
    options: ["Still exploring", "Roughly defined", "Very specific"],
    scores: [0, 1, 2],
  },
];

type Result = { title: string; body: string; step: string };

function resultFor(score: number): Result {
  if (score <= 3)
    return {
      title: "Early — and that is fine",
      body: "You are at the start. The most valuable next move is not a build, it is clarity: finding where AI is actually worth it for your business.",
      step: "Recommended first step: the AI Opportunity Diagnostic.",
    };
  if (score <= 6)
    return {
      title: "Ready for a focused first build",
      body: "You have the raw ingredients. With the right problem chosen and your data in order, a contained 90-day build is a sensible move.",
      step: "Recommended first step: a 30-minute call to scope the highest-value system.",
    };
  return {
    title: "Ready to build",
    body: "You have clear problems, accessible data, and prior momentum. You are well-placed for a 90-day build that ships a working system.",
    step: "Recommended first step: a 30-minute call to plan the 90 days.",
  };
}

export function Readiness() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const total = QUESTIONS.length;
  const done = step >= total;
  const score = answers.reduce((a, b) => a + b, 0);
  const result = done ? resultFor(score) : null;

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
              AI readiness assessment
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
              Not sure if your business is ready? Find out in two minutes.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-steel">
              A short, honest self-check. No email required to see your result. We will tell you
              where you stand — including if the answer is &ldquo;not yet.&rdquo;
            </p>
            <ul className="mt-6 space-y-2.5 text-steel">
              {["Four quick questions", "An honest, tailored read", "A sensible first step"].map(
                (li) => (
                  <li key={li} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal/15 text-xs text-teal">
                      ✓
                    </span>
                    {li}
                  </li>
                )
              )}
            </ul>
            <p className="mt-6 text-sm text-steel/70">
              <PlaceholderTag>demo logic</PlaceholderTag>{" "}
              Final version scores with AI and emails a fuller readiness guide.
            </p>
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
                  Question {step + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-sapphire">
                  {QUESTIONS[step].q}
                </h3>
                <div className="mt-6 space-y-3">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => choose(QUESTIONS[step].scores[i])}
                      data-sound="click"
                      className="focus-brand group flex w-full items-center justify-between rounded-md border border-cloud bg-mist/40 px-5 py-4 text-left font-medium text-midnight transition-all duration-200 ease-brand hover:border-teal hover:bg-mist"
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
                  Your result
                </div>
                <h3 className="mt-4 text-2xl font-bold text-sapphire">{result!.title}</h3>
                <p className="mt-3 leading-relaxed text-steel">{result!.body}</p>
                <p className="mt-4 rounded-md border-l-2 border-brass bg-mist/50 px-4 py-3 text-sm font-medium text-sapphire">
                  {result!.step}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <CTAButton variant="primary" href="#book" className="flex-1">
                    Book a 30-minute call
                  </CTAButton>
                  <CTAButton variant="secondary" onClick={reset}>
                    Start over
                  </CTAButton>
                </div>
                <Reassurance
                  className="mt-4"
                  items={["No email needed for this", "No obligation", "30 minutes"]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
