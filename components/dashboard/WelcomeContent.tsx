"use client";

import { DashboardShell } from "./DashboardShell";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Client view for /dashboard/welcome (prospect home). The page route fetches the
 * profile server-side and passes the plain fields here so the copy can read the
 * active language (localStorage, via LanguageContext).
 */
export function WelcomeContent({
  firstName,
  fullName,
  company,
  email,
}: {
  firstName: string;
  fullName: string;
  company: string;
  email: string;
}) {
  const { t } = useLanguage();
  const name = firstName || t.dash.fallbackName;

  return (
    <DashboardShell
      logoLabel={t.dash.logoLabel}
      eyebrow={t.dash.welcomeEyebrow}
      title={
        <>
          {t.dash.welcomeTitlePre}
          <span className="gradient-text">{name}.</span>
        </>
      }
      subtitle={t.dash.welcomeSubtitle}
      email={email}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* Review status */}
        <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lumive-light/15 text-lumive-light">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-teal">{t.dash.statusLabel}</p>
              <p className="text-lg font-semibold text-sapphire">{t.dash.underReview}</p>
            </div>
          </div>
          <p className="mt-5 leading-relaxed text-steel">
            {t.dash.reviewBodyPre}
            <span className="font-medium text-midnight">{t.dash.reviewBold}</span>
            {t.dash.reviewBodyPost}
          </p>

          <ul className="mt-7 space-y-3.5">
            {t.dash.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/12 font-mono text-[11px] font-semibold text-teal">
                  {i + 1}
                </span>
                <span className="leading-snug text-steel">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Their details on file */}
        <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wide text-steel">{t.dash.onFile}</p>
          <dl className="mt-5 space-y-5">
            <Detail label={t.dash.detailName} value={fullName || "—"} />
            <Detail label={t.dash.detailCompany} value={company || "—"} />
            <Detail label={t.dash.detailEmail} value={email || "—"} ltr />
          </dl>
          <p className="mt-7 border-t border-cloud/70 pt-5 text-sm leading-relaxed text-steel/80">
            {t.dash.correctionNote}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-medium text-midnight" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}
