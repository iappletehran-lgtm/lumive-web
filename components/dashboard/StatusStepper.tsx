"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

/** The five project stages, in order. Mirrors the projects.status check constraint. */
export const STAGES = ["discovery", "build", "launch", "review", "complete"] as const;
export type Stage = (typeof STAGES)[number];

/**
 * Horizontal project-status stepper. Completed stages read in teal (growth),
 * the current stage in Lumive Light (the active-state accent), upcoming stages
 * stay quiet in cloud — no brass, which the brand reserves for conversion.
 */
export function StatusStepper({ status }: { status: Stage }) {
  const { t } = useLanguage();
  const current = STAGES.indexOf(status);

  return (
    <ol className="flex items-center">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                  done && "border-teal bg-teal text-white",
                  active && "border-lumive-light bg-lumive-light/15 text-teal ring-2 ring-lumive-light/30",
                  !done && !active && "border-cloud bg-white/60 text-steel/60",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-wide",
                  active ? "font-semibold text-sapphire" : done ? "text-teal" : "text-steel/60",
                ].join(" ")}
              >
                {t.dash.stages[stage]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <span
                className={[
                  "mx-1.5 mb-5 h-px flex-1 sm:mx-3",
                  i < current ? "bg-teal" : "bg-cloud",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
