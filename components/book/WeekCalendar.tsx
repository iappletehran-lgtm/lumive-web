"use client";

import { useEffect, useMemo, useState } from "react";

type SlotsByDate = Record<string, { start: string }[]>;

function ymd(d: Date): string {
  // Local Y-M-D — matches the date keys Cal returns for the same timezone.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Rolling 7-day availability picker. Fetches real Cal.com slots for the visible
 * window, lets the visitor choose a day then a time. Times render in the
 * visitor's own timezone. No price is shown here.
 */
export function WeekCalendar({
  timeZone,
  onPick,
}: {
  timeZone: string;
  onPick: (iso: string) => void;
}) {
  const today = useMemo(startOfToday, []);
  const [anchor, setAnchor] = useState<Date>(today);
  const [slots, setSlots] = useState<SlotsByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const canGoBack = anchor > today;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const start = ymd(anchor);
    const end = ymd(addDays(anchor, 7));
    fetch(`/api/slots?start=${start}&end=${end}&tz=${encodeURIComponent(timeZone)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) throw new Error(j.error || "Could not load availability.");
        const data: SlotsByDate = j.slots || {};
        setSlots(data);
        // Auto-select the first day in view that has future slots.
        const now = Date.now();
        const firstOpen = days
          .map(ymd)
          .find((d) => (data[d] || []).some((s) => new Date(s.start).getTime() > now));
        setActiveDay(firstOpen ?? null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, timeZone]);

  const now = Date.now();
  const activeSlots = (activeDay ? slots[activeDay] || [] : []).filter(
    (s) => new Date(s.start).getTime() > now
  );

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });

  return (
    <div>
      {/* week nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canGoBack && setAnchor(addDays(anchor, -7))}
          disabled={!canGoBack}
          data-sound="nav"
          aria-label="Previous week"
          className="focus-brand flex h-8 w-8 items-center justify-center rounded-md border border-cloud bg-white/60 text-sapphire transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="font-mono text-[11px] uppercase tracking-wide text-steel">
          {anchor.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone })} –{" "}
          {addDays(anchor, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone })}
        </span>
        <button
          type="button"
          onClick={() => setAnchor(addDays(anchor, 7))}
          data-sound="nav"
          aria-label="Next week"
          className="focus-brand flex h-8 w-8 items-center justify-center rounded-md border border-cloud bg-white/60 text-sapphire transition-colors hover:bg-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      {/* day strip */}
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = ymd(d);
          const has = (slots[key] || []).some((s) => new Date(s.start).getTime() > now);
          const isActive = key === activeDay;
          return (
            <button
              key={key}
              type="button"
              disabled={!has}
              onClick={() => setActiveDay(key)}
              data-sound="nav"
              className={[
                "focus-brand flex flex-col items-center rounded-lg border py-2.5 transition-colors",
                isActive
                  ? "border-sapphire bg-sapphire text-mist"
                  : has
                    ? "border-cloud bg-white/60 text-midnight hover:border-sapphire/40 hover:bg-white"
                    : "cursor-not-allowed border-cloud/60 bg-white/30 text-steel/40",
              ].join(" ")}
            >
              <span className="font-mono text-[10px] uppercase tracking-wide">
                {d.toLocaleDateString("en-US", { weekday: "short", timeZone })}
              </span>
              <span className="mt-0.5 text-base font-semibold">{d.getDate()}</span>
              <span
                className={`mt-1 h-1 w-1 rounded-full ${has ? (isActive ? "bg-lumive-light" : "bg-teal") : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      {/* time slots */}
      <div className="mt-6 min-h-[120px]">
        {loading ? (
          <p className="py-8 text-center text-sm text-steel/70">Loading available times…</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-ember">{error}</p>
        ) : activeSlots.length === 0 ? (
          <p className="py-8 text-center text-sm text-steel/70">
            No times available this week. Try the next week.
          </p>
        ) : (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-steel">
              Available times{" "}
              <span className="text-steel/50">· {timeZone.replace(/_/g, " ")}</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {activeSlots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => onPick(s.start)}
                  data-sound="cta"
                  className="focus-brand rounded-md border border-cloud bg-white/70 px-3 py-2.5 text-sm font-medium text-midnight transition-all hover:border-sapphire hover:bg-sapphire hover:text-mist"
                >
                  {fmtTime(s.start)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
