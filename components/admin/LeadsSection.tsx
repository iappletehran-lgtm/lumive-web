"use client";

import { useMemo, useState } from "react";
import { markLeadContacted } from "@/app/admin/actions";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtDate } from "@/lib/i18n/adminDate";

export type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  company: string | null;
  industry: string | null;
  message: string | null;
  source: string | null;
  language: string | null;
  contacted: boolean;
  created_at: string;
};

type SourceFilter = "all" | "chat" | "telegram" | "voice";
type LangFilter = "all" | "en" | "fa";

const SOURCE_STYLE: Record<string, string> = {
  chat: "bg-sapphire/10 text-sapphire",
  telegram: "bg-lumive-light/12 text-teal",
  voice: "bg-brass/15 text-[#8a6d1f]",
};

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Admin "Leads" viewer. Leads are fetched server-side with the service-role key
 * and passed in; filtering + CSV export are client-side. "Mark as contacted" runs
 * the markLeadContacted server action. Emails/phones render LTR inside RTL.
 */
export function LeadsSection({ leads }: { leads: LeadRow[] }) {
  const { t, lang: uiLang } = useLanguage();
  const c = t.admin.leads;

  const [source, setSource] = useState<SourceFilter>("all");
  const [lang, setLang] = useState<LangFilter>("all");

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (source !== "all" && (l.source || "chat") !== source) return false;
        if (lang !== "all" && (l.language || "en") !== lang) return false;
        return true;
      }),
    [leads, source, lang]
  );

  function exportCsv() {
    const header = ["name", "email", "phone", "company", "industry", "source", "language", "contacted", "date", "message"];
    const rows = filtered.map((l) => [
      l.full_name ?? "",
      l.email ?? "",
      l.phone_number ?? "",
      l.company ?? "",
      l.industry ?? "",
      l.source ?? "chat",
      l.language ?? "en",
      l.contacted ? "yes" : "no",
      fmtDate(l.created_at, "en"),
      l.message ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "rounded-md border border-cloud bg-white/70 px-2.5 py-2 text-sm text-midnight focus:border-sapphire focus:bg-white focus:outline-none";

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-sapphire">{c.title}</h2>
        <span className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
          {c.showing} {filtered.length} {c.of} {leads.length}
        </span>
      </div>

      {/* Filters */}
      <div className="glass-tint mb-4 rounded-2xl border border-white/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.source}</span>
            <select value={source} onChange={(e) => setSource(e.target.value as SourceFilter)} className={selectCls}>
              <option value="all">{c.all}</option>
              <option value="chat">{c.sources.chat}</option>
              <option value="telegram">{c.sources.telegram}</option>
              <option value="voice">{c.sources.voice}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as LangFilter)} className={selectCls}>
              <option value="all">{c.all}</option>
              <option value="en">{t.admin.langNames.en}</option>
              <option value="fa">{t.admin.langNames.fa}</option>
            </select>
          </label>
          <div className="ms-auto">
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              data-sound="cta"
              className="focus-brand glow-cta rounded-md bg-brass px-3.5 py-2 text-sm font-semibold text-midnight transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {c.exportCsv}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-tint overflow-hidden rounded-2xl border border-white/70 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-start">
            <thead>
              <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                <Th>{c.thName}</Th>
                <Th>{c.thEmail}</Th>
                <Th>{c.thPhone}</Th>
                <Th>{c.thCompany}</Th>
                <Th>{c.thSource}</Th>
                <Th>{c.thLang}</Th>
                <Th>{c.thDate}</Th>
                <Th className="text-end">{c.thStatus}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud/50">
              {leads.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-steel/60">{c.empty}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-steel/60">{c.noMatch}</td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-white/40">
                    <td className="px-4 py-3.5 text-sm font-medium text-midnight">{l.full_name || <span className="text-steel/40">{c.dash}</span>}</td>
                    <td className="px-4 py-3.5 text-sm text-steel"><span dir="ltr">{l.email || c.dash}</span></td>
                    <td className="px-4 py-3.5 text-sm text-steel"><span dir="ltr">{l.phone_number || c.dash}</span></td>
                    <td className="px-4 py-3.5 text-sm text-steel">{l.company || <span className="text-steel/40">{c.dash}</span>}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${SOURCE_STYLE[l.source || "chat"] ?? "bg-sapphire/10 text-sapphire"}`}>
                        {c.sources[(l.source || "chat") as keyof typeof c.sources] ?? (l.source || "chat")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-steel/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-steel">
                        {t.admin.langNames[(l.language || "en") === "fa" ? "fa" : "en"]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-steel/80" dir="ltr">{fmtDate(l.created_at, uiLang)}</td>
                    <td className="px-4 py-3.5 text-end">
                      {l.contacted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/12 px-2.5 py-1 text-xs font-semibold text-teal">
                          ✓ {c.contacted}
                        </span>
                      ) : (
                        <form action={markLeadContacted} className="inline">
                          <input type="hidden" name="id" value={l.id} />
                          <button
                            type="submit"
                            data-sound="nav"
                            className="focus-brand rounded-md border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-semibold text-teal transition-all hover:bg-teal hover:text-white"
                          >
                            {c.markContacted}
                          </button>
                        </form>
                      )}
                    </td>
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
  return <th className={`px-4 py-3.5 font-medium ${className}`}>{children}</th>;
}
