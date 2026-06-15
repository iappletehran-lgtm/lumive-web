"use client";

import { DashboardShell } from "./DashboardShell";
import { StatusStepper, type Stage } from "./StatusStepper";
import { BOOKING_URL } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type Deliverable = {
  id: string;
  name: string;
  file_url: string | null;
  uploaded_at: string;
};

export type Project = {
  id: string;
  title: string;
  status: Stage;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  deliverables: Deliverable[];
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  // International date format with Western numerals, per the brand rules.
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Client view for /dashboard (client home). The page route fetches projects +
 * profile server-side (RLS-scoped) and passes them here so the copy can read the
 * active language. Dates stay in the international (English-locale) format.
 */
export function DashboardContent({
  firstName,
  company,
  email,
  projects,
}: {
  firstName: string;
  company: string;
  email: string;
  projects: Project[];
}) {
  const { t } = useLanguage();
  const name = firstName || t.dash.fallbackName;

  return (
    <DashboardShell
      logoLabel={t.dash.logoLabel}
      eyebrow={t.dash.workspaceEyebrow}
      title={
        <>
          {t.dash.helloTitlePre}
          <span className="gradient-text">{name}.</span>
        </>
      }
      subtitle={
        company
          ? `${t.dash.subtitleCompanyPre}${company}${t.dash.subtitleCompanyPost}`
          : t.dash.subtitleNoCompany
      }
      email={email}
    >
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-7">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { t } = useLanguage();
  const started = fmtDate(project.start_date);
  return (
    <article className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-sapphire">{project.title}</h2>
          {started && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-steel/70">
              {t.dash.startedPre}
              <span dir="ltr">{started}</span>
            </p>
          )}
        </div>
        <span className="rounded-full bg-lumive-light/12 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-teal">
          {t.dash.stages[project.status]}
        </span>
      </div>

      <div className="mt-7 overflow-x-auto">
        <StatusStepper status={project.status} />
      </div>

      {project.notes && (
        <p className="mt-7 rounded-xl border border-cloud/70 bg-white/50 p-4 text-sm leading-relaxed text-steel">
          {project.notes}
        </p>
      )}

      <div className="mt-7">
        <p className="font-mono text-[11px] uppercase tracking-wide text-steel">
          {t.dash.deliverables}
        </p>
        {project.deliverables.length === 0 ? (
          <p className="mt-3 text-sm text-steel/70">{t.dash.noDeliverables}</p>
        ) : (
          <ul className="mt-3 divide-y divide-cloud/60 rounded-xl border border-cloud/60 bg-white/40">
            {project.deliverables.map((d) => (
              <DeliverableRow key={d.id} deliverable={d} />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function DeliverableRow({ deliverable }: { deliverable: Deliverable }) {
  const { t } = useLanguage();
  const uploaded = fmtDate(deliverable.uploaded_at);
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sapphire/8 text-sapphire">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /></svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-midnight">{deliverable.name}</p>
          {uploaded && (
            <p className="font-mono text-[10px] uppercase tracking-wide text-steel/60" dir="ltr">
              {uploaded}
            </p>
          )}
        </div>
      </div>
      {deliverable.file_url ? (
        <a
          href={deliverable.file_url}
          target="_blank"
          rel="noopener noreferrer"
          data-sound="nav"
          className="focus-brand shrink-0 rounded-md border border-sapphire/20 bg-white/60 px-3 py-1.5 text-xs font-medium text-sapphire transition-all hover:bg-white"
        >
          {t.dash.open}
        </a>
      ) : (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-steel/50">
          {t.dash.pending}
        </span>
      )}
    </li>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="glass-tint rounded-2xl border border-white/70 p-10 text-center shadow-lg lg:p-14">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/12 text-teal">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
      </span>
      <h2 className="mt-5 text-xl font-semibold text-sapphire">{t.dash.emptyTitle}</h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-steel">{t.dash.emptyBody}</p>
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-sound="cta"
        className="focus-brand glow-cta mt-7 inline-flex items-center justify-center rounded-md bg-brass px-6 py-3 font-semibold text-midnight shadow-md transition-all hover:brightness-95"
      >
        {t.common.bookCall30}
      </a>
    </div>
  );
}
