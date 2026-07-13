"use client";

import { useState } from "react";
import { addProject, updateProjectStatus } from "@/app/admin/actions";
import { PROJECT_STATUSES, isProjectStatus } from "@/lib/projects";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtDate } from "@/lib/i18n/adminDate";

export type ProjectRow = {
  id: string;
  client_id: string | null;
  title: string;
  status: string;
  start_date: string | null;
  notes: string | null;
  created_at: string;
};

export type ClientOption = { id: string; name: string };

const STATUS_STYLE: Record<string, string> = {
  discovery: "bg-steel/10 text-steel",
  build: "bg-brass/15 text-[#8a6d1f]",
  launch: "bg-slate-indigo/15 text-slate-indigo",
  review: "bg-sapphire/10 text-sapphire",
  complete: "bg-teal/12 text-teal",
};

/**
 * Admin "Projects" section. Rows are fetched server-side (service-role) and passed
 * in. Status is edited via a per-row dropdown that submits the updateProjectStatus
 * server action on change; a toggle reveals the "new project" form (addProject).
 * Bilingual via useLanguage(); dates render LTR with Western numerals.
 */
export function ProjectsSection({ projects, clients }: { projects: ProjectRow[]; clients: ClientOption[] }) {
  const { t, lang } = useLanguage();
  const c = t.admin.projects;
  const [showForm, setShowForm] = useState(false);
  const nameById = new Map(clients.map((x) => [x.id, x.name]));

  const selectCls =
    "rounded-md border border-cloud bg-white/70 px-2.5 py-2 text-sm text-midnight focus:border-sapphire focus:bg-white focus:outline-none";

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-sapphire">{c.title}</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          data-sound="nav"
          className="focus-brand rounded-md border border-sapphire/25 bg-white/60 px-3.5 py-2 text-sm font-medium text-sapphire transition-all hover:bg-white"
        >
          {showForm ? c.cancel : c.addNew}
        </button>
      </div>

      {/* New-project form */}
      {showForm && (
        <form
          action={addProject}
          onSubmit={() => setShowForm(false)}
          className="glass-tint mb-4 rounded-2xl border border-white/70 p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-semibold text-sapphire">{c.formTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fTitle}</span>
              <input name="title" required placeholder={c.titlePlaceholder} className={selectCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fClient}</span>
              <select name="client_id" className={selectCls} defaultValue="">
                <option value="">{c.unassigned}</option>
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fStatus}</span>
              <select name="status" className={selectCls} defaultValue="discovery">
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{c.statuses[s]}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fStart}</span>
              <input type="date" name="start_date" dir="ltr" className={selectCls} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fNotes}</span>
              <textarea name="notes" rows={2} placeholder={c.notesPlaceholder} className={selectCls + " resize-y"} />
            </label>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              data-sound="cta"
              className="focus-brand glow-cta rounded-md bg-brass px-4 py-2 text-sm font-semibold text-midnight transition-all hover:brightness-95"
            >
              {c.save}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="glass-tint overflow-hidden rounded-2xl border border-white/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-start">
            <thead>
              <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                <Th>{c.thClient}</Th>
                <Th>{c.thTitle}</Th>
                <Th>{c.thStatus}</Th>
                <Th>{c.thStart}</Th>
                <Th>{c.thNotes}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud/50">
              {projects.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-steel/60">{c.empty}</td></tr>
              ) : (
                projects.map((p) => {
                  const label = isProjectStatus(p.status) ? c.statuses[p.status] : p.status;
                  return (
                    <tr key={p.id} className="align-top transition-colors hover:bg-white/40">
                      <td className="px-5 py-4 text-sm text-steel">
                        {p.client_id ? (nameById.get(p.client_id) ?? <span className="text-steel/40">{c.unassigned}</span>) : <span className="text-steel/40">{c.unassigned}</span>}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-midnight">{p.title}</td>
                      <td className="px-5 py-4">
                        <form action={updateProjectStatus} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={p.id} />
                          <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[p.status] ?? "bg-steel/10 text-steel"}`}>
                            {label}
                          </span>
                          <select
                            name="status"
                            defaultValue={p.status}
                            aria-label={c.thStatus}
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                            className="rounded-md border border-cloud bg-white/70 px-2 py-1 text-xs text-midnight focus:border-sapphire focus:bg-white focus:outline-none"
                          >
                            {PROJECT_STATUSES.map((s) => (
                              <option key={s} value={s}>{c.statuses[s]}</option>
                            ))}
                          </select>
                        </form>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">
                        {p.start_date ? fmtDate(p.start_date, lang) : <span className="text-steel/40">{c.dash}</span>}
                      </td>
                      <td className="max-w-[280px] px-5 py-4 text-sm text-steel">
                        {p.notes ? <span className="line-clamp-2">{p.notes}</span> : <span className="text-steel/40">{c.dash}</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3.5 font-medium ${className}`}>{children}</th>;
}
