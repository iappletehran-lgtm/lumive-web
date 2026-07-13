"use client";

import { useState } from "react";
import { deleteMemory } from "@/app/admin/actions";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type MemoryRow = {
  id: string;
  session_id: string;
  language: string | null;
  summary: string | null;
  key_facts: Record<string, unknown> | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Admin "Memories" section — the chatbot's long-term memory. Rows are fetched
 * server-side (service-role) and passed in. "View" expands the full summary and
 * key facts inline; "Delete" runs the deleteMemory server action. Bilingual via
 * useLanguage(); session IDs / dates render LTR.
 */
export function MemoriesSection({ memories }: { memories: MemoryRow[] }) {
  const { t } = useLanguage();
  const c = t.admin.memories;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function factEntries(facts: Record<string, unknown> | null): [string, string][] {
    if (!facts || typeof facts !== "object") return [];
    return Object.entries(facts).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-sapphire">{c.title}</h2>
        <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70" dir="ltr">
          {memories.length}
        </span>
      </div>

      <div className="glass-tint overflow-hidden rounded-2xl border border-white/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-start">
            <thead>
              <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                <Th>{c.thSession}</Th>
                <Th>{c.thLang}</Th>
                <Th>{c.thSummary}</Th>
                <Th>{c.thDate}</Th>
                <Th className="text-end">{c.thAction}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud/50">
              {memories.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-steel/60">{c.empty}</td></tr>
              ) : (
                memories.map((m) => {
                  const isOpen = expanded.has(m.id);
                  const facts = factEntries(m.key_facts);
                  return (
                    <FragmentRow key={m.id}>
                      <tr className="align-top transition-colors hover:bg-white/40">
                        <td className="px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">{m.session_id}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-steel/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-steel">
                            {(m.language || "en") === "fa" ? "FA" : "EN"}
                          </span>
                        </td>
                        <td className="max-w-[320px] px-5 py-4 text-sm text-steel">
                          {m.summary ? (
                            <span className={isOpen ? "" : "line-clamp-2"}>{m.summary}</span>
                          ) : (
                            <span className="text-steel/40">{c.noSummary}</span>
                          )}
                          {isOpen && facts.length > 0 && (
                            <div className="mt-3 rounded-lg border border-cloud/60 bg-white/50 p-3">
                              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-steel/60">{c.keyFacts}</p>
                              <dl className="space-y-1">
                                {facts.map(([k, v]) => (
                                  <div key={k} className="flex gap-2 text-xs">
                                    <dt className="font-medium text-midnight">{k}:</dt>
                                    <dd className="text-steel">{v}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">{fmtDate(m.created_at)}</td>
                        <td className="px-5 py-4 text-end">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggle(m.id)}
                              data-sound="nav"
                              aria-expanded={isOpen}
                              className="focus-brand rounded-md border border-sapphire/25 bg-white/60 px-3 py-1.5 text-xs font-semibold text-sapphire transition-all hover:bg-white"
                            >
                              {isOpen ? c.hide : c.view}
                            </button>
                            <form action={deleteMemory} className="inline">
                              <input type="hidden" name="id" value={m.id} />
                              <button
                                type="submit"
                                data-sound="nav"
                                className="focus-brand rounded-md border border-ember/30 bg-ember/5 px-3 py-1.5 text-xs font-semibold text-ember transition-all hover:bg-ember hover:text-white"
                              >
                                {c.delete}
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    </FragmentRow>
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

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
