"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export type AdminStats = {
  leads: number;
  bookings: number;
  chatSessions: number;
  voiceSessions: number;
};

/**
 * Admin overview — four headline counts (leads, bookings, chat sessions, voice
 * sessions). Counts are computed server-side and passed in. Numbers render LTR
 * with Western numerals, per the brand rules.
 */
export function AnalyticsSection({ stats }: { stats: AdminStats }) {
  const { t } = useLanguage();
  const a = t.admin.analytics;

  const cards = [
    { label: a.totalLeads, value: stats.leads },
    { label: a.totalBookings, value: stats.bookings },
    { label: a.totalChatSessions, value: stats.chatSessions },
    { label: a.totalVoiceSessions, value: stats.voiceSessions },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-sapphire">{a.title}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass-tint rounded-2xl border border-white/70 p-5 shadow-lg"
          >
            <p className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-sapphire" dir="ltr">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
