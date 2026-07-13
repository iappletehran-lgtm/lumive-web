"use client";

import { useState } from "react";
import { addDeliverable } from "@/app/admin/actions";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type DeliverableRow = {
  id: string;
  project_id: string | null;
  name: string;
  file_url: string | null;
  uploaded_at: string;
};

export type ProjectOption = { id: string; title: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Admin "Deliverables" section. Rows are fetched server-side (service-role) and
 * passed in. A toggle reveals the "new deliverable" form (addDeliverable). URLs
 * render LTR and open in a new tab. Bilingual via useLanguage().
 */
export function DeliverablesSection({ deliverables, projects }: { deliverables: DeliverableRow[]; projects: ProjectOption[] }) {
  const { t } = useLanguage();
  const c = t.admin.deliverables;
  const [showForm, setShowForm] = useState(false);
  const titleById = new Map(projects.map((p) => [p.id, p.title]));

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

      {/* New-deliverable form */}
      {showForm && (
        <form
          action={addDeliverable}
          onSubmit={() => setShowForm(false)}
          className="glass-tint mb-4 rounded-2xl border border-white/70 p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-semibold text-sapphire">{c.formTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fName}</span>
              <input name="name" required placeholder={c.namePlaceholder} className={selectCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fProject}</span>
              <select name="project_id" className={selectCls} defaultValue="">
                <option value="">{c.unassigned}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.fUrl}</span>
              <input name="file_url" type="url" dir="ltr" placeholder={c.urlPlaceholder} className={selectCls} />
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
          <table className="w-full min-w-[720px] border-collapse text-start">
            <thead>
              <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                <Th>{c.thProject}</Th>
                <Th>{c.thName}</Th>
                <Th>{c.thUrl}</Th>
                <Th>{c.thUploaded}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud/50">
              {deliverables.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-steel/60">{c.empty}</td></tr>
              ) : (
                deliverables.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-white/40">
                    <td className="px-5 py-4 text-sm text-steel">
                      {d.project_id ? (titleById.get(d.project_id) ?? <span className="text-steel/40">{c.unassigned}</span>) : <span className="text-steel/40">{c.unassigned}</span>}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-midnight">{d.name}</td>
                    <td className="px-5 py-4 text-sm">
                      {d.file_url ? (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="text-sapphire underline-offset-2 hover:underline"
                        >
                          {c.open}
                        </a>
                      ) : (
                        <span className="text-steel/40">{c.dash}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">{fmtDate(d.uploaded_at)}</td>
                  </tr>
                ))
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
