"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type ChatMessage = { role: string; content: string };

export type ChatLogRow = {
  id: string;
  created_at: string;
  language: "en" | "fa";
  user_email: string | null; // null → guest
  messages: ChatMessage[];
};

type LangFilter = "all" | "en" | "fa";
type UserFilter = "all" | "user" | "guest";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function firstUserMessage(messages: ChatMessage[]) {
  return messages.find((m) => m.role === "user")?.content ?? messages[0]?.content ?? "";
}
function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Admin "Chat Logs" viewer. All data is fetched server-side with the service-role
 * key and passed in; filtering, expand, and CSV export are client-side over that
 * set. Dates/emails render LTR so they read correctly inside the RTL layout.
 */
export function ChatLogsSection({ logs }: { logs: ChatLogRow[] }) {
  const { t } = useLanguage();
  const c = t.admin.chatLogs;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [userType, setUserType] = useState<UserFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toTs = to ? new Date(to + "T23:59:59.999").getTime() : null;
    const kw = keyword.trim().toLowerCase();
    return logs.filter((l) => {
      if (lang !== "all" && l.language !== lang) return false;
      if (userType === "user" && !l.user_email) return false;
      if (userType === "guest" && l.user_email) return false;
      const ts = new Date(l.created_at).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (kw) {
        const inMsgs = l.messages.some((m) => (m.content || "").toLowerCase().includes(kw));
        const inEmail = (l.user_email || "").toLowerCase().includes(kw);
        if (!inMsgs && !inEmail) return false;
      }
      return true;
    });
  }, [logs, from, to, lang, userType, keyword]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setLang("all");
    setUserType("all");
    setKeyword("");
  }

  function exportCsv() {
    const header = ["id", "date", "time", "language", "user_email", "message_count", "full_conversation"];
    const rows = filtered.map((l) => [
      l.id,
      fmtDate(l.created_at),
      fmtTime(l.created_at),
      l.language,
      l.user_email ?? "Guest",
      l.messages.length,
      l.messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    // BOM so Excel reads UTF-8 (Persian) correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-logs-${new Date().toISOString().slice(0, 10)}.csv`;
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
          {c.showing} {filtered.length} {c.of} {logs.length}
        </span>
      </div>

      {/* Filters */}
      <div className="glass-tint mb-4 rounded-2xl border border-white/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.from}</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" className={selectCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.to}</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" className={selectCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as LangFilter)} className={selectCls}>
              <option value="all">{c.all}</option>
              <option value="en">EN</option>
              <option value="fa">FA</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.userType}</span>
            <select value={userType} onChange={(e) => setUserType(e.target.value as UserFilter)} className={selectCls}>
              <option value="all">{c.all}</option>
              <option value="user">{c.typeLoggedIn}</option>
              <option value="guest">{c.typeGuest}</option>
            </select>
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-steel">{c.searchPlaceholder}</span>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={c.searchPlaceholder}
              className={selectCls + " w-full"}
            />
          </label>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={clearFilters}
              data-sound="nav"
              className="focus-brand rounded-md border border-sapphire/25 bg-white/60 px-3.5 py-2 text-sm font-medium text-sapphire transition-all hover:bg-white"
            >
              {c.clear}
            </button>
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
          <table className="w-full min-w-[760px] border-collapse text-start">
            <thead>
              <tr className="border-b border-cloud/70 font-mono text-[10px] uppercase tracking-wide text-steel">
                <Th>{c.thDateTime}</Th>
                <Th>{c.thLang}</Th>
                <Th>{c.thUser}</Th>
                <Th className="text-center">{c.thCount}</Th>
                <Th>{c.thPreview}</Th>
                <Th className="text-end">{c.thView}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud/50">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-steel/60">{c.empty}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-steel/60">{c.noMatch}</td></tr>
              ) : (
                filtered.map((l) => {
                  const isOpen = expanded.has(l.id);
                  return (
                    <FragmentRow key={l.id}>
                      <tr className="transition-colors hover:bg-white/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-steel/80" dir="ltr">
                          {fmtDate(l.created_at)} · {fmtTime(l.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide ${
                              l.language === "fa" ? "bg-teal/12 text-teal" : "bg-sapphire/10 text-sapphire"
                            }`}
                          >
                            {l.language === "fa" ? "FA" : "EN"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-steel">
                          {l.user_email ? (
                            <span dir="ltr">{l.user_email}</span>
                          ) : (
                            <span className="text-steel/50">{c.guest}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums text-midnight">{l.messages.length}</td>
                        <td className="max-w-[280px] px-5 py-4 text-sm text-steel">
                          <span className="line-clamp-1 block truncate">{firstUserMessage(l.messages) || "—"}</span>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <button
                            type="button"
                            onClick={() => toggle(l.id)}
                            data-sound="nav"
                            aria-expanded={isOpen}
                            className="focus-brand rounded-md border border-sapphire/25 bg-white/60 px-3 py-1.5 text-xs font-semibold text-sapphire transition-all hover:bg-white"
                          >
                            {isOpen ? c.hide : c.view}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-mist/40">
                          <td colSpan={6} className="px-5 py-5">
                            <div className="space-y-3">
                              {l.messages.map((m, i) => {
                                const isUser = m.role === "user";
                                return (
                                  <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                                    <div className="max-w-[80%]">
                                      <p className={`mb-1 font-mono text-[10px] uppercase tracking-wide ${isUser ? "text-steel/60" : "text-teal"}`}>
                                        {isUser ? c.roleVisitor : c.roleLumi}
                                      </p>
                                      <div
                                        className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                          isUser
                                            ? "rounded-tl-sm border border-cloud/70 bg-white text-midnight"
                                            : "rounded-tr-sm bg-sapphire text-mist"
                                        }`}
                                      >
                                        {m.content}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
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

// Group a row with its optional expanded row without an extra DOM wrapper.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
