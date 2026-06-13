/**
 * Cal.com API v2 wrapper. SERVER ONLY (reads CAL_API_KEY). Resolves the event
 * type from CAL_EVENT_TYPE_SLUG, lists available slots, and creates a booking
 * once payment is confirmed.
 *
 * Note: the configured slug may not match Cal's actual slug (e.g. the dashboard
 * slug is "30min" while the title is "30 min meeting"), so resolveEventType
 * matches on a normalized slug OR title. v1 is decommissioned — v2 only, and
 * each endpoint pins its own cal-api-version.
 */
const API_BASE = "https://api.cal.com/v2";
const V_EVENT_TYPES = "2024-06-14";
const V_SLOTS = "2024-09-04";
const V_BOOKINGS = "2024-08-13";

export type CalEventType = { id: number; lengthInMinutes: number; slug: string; title: string };
export type SlotsByDate = Record<string, { start: string }[]>;

function headers(version: string): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.CAL_API_KEY}`,
    "cal-api-version": version,
    "content-type": "application/json",
  };
}

const norm = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

let cached: CalEventType | null = null;

/** Resolve and cache the consultation event type via the configured slug/title. */
export async function resolveEventType(): Promise<CalEventType | null> {
  if (!process.env.CAL_API_KEY) return null;
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/event-types`, {
    headers: headers(V_EVENT_TYPES),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cal event-types ${res.status}: ${await res.text().catch(() => "")}`);

  const json = await res.json();
  const list: any[] = json.data || [];
  const target = norm(process.env.CAL_EVENT_TYPE_SLUG || "");

  const et =
    list.find((e) => e.slug === process.env.CAL_EVENT_TYPE_SLUG) ||
    list.find((e) => norm(e.slug) === target || norm(e.title) === target) ||
    list.find((e) => target && (norm(e.title).includes(target) || target.includes(norm(e.slug))));

  if (!et) throw new Error(`cal: no event type matching "${process.env.CAL_EVENT_TYPE_SLUG}"`);

  cached = { id: et.id, lengthInMinutes: et.lengthInMinutes || 30, slug: et.slug, title: et.title };
  return cached;
}

/** Available slots for a date range (YYYY-MM-DD), grouped by date in `timeZone`. */
export async function getSlots(opts: {
  start: string;
  end: string;
  timeZone: string;
}): Promise<SlotsByDate> {
  const et = await resolveEventType();
  if (!et) return {};

  const url = new URL(`${API_BASE}/slots`);
  url.searchParams.set("eventTypeId", String(et.id));
  url.searchParams.set("start", opts.start);
  url.searchParams.set("end", opts.end);
  url.searchParams.set("timeZone", opts.timeZone);

  const res = await fetch(url, { headers: headers(V_SLOTS), cache: "no-store" });
  if (!res.ok) throw new Error(`cal slots ${res.status}: ${await res.text().catch(() => "")}`);

  const json = await res.json();
  return (json.data || {}) as SlotsByDate;
}

/** Create the confirmed booking. Returns the Cal booking uid + a meeting link. */
export async function createBooking(opts: {
  startISO: string;
  name: string;
  email: string;
  timeZone: string;
}): Promise<{ uid: string | null; meetingUrl: string | null }> {
  const et = await resolveEventType();
  if (!et) throw new Error("cal: event type unavailable");

  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: headers(V_BOOKINGS),
    body: JSON.stringify({
      start: opts.startISO,
      eventTypeId: et.id,
      attendee: {
        name: opts.name || "Lumive client",
        email: opts.email,
        timeZone: opts.timeZone,
        language: "en",
      },
      metadata: { source: "lumive-book" },
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`cal booking ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  }

  const d = json.data || {};
  const uid: string | null = d.uid || null;
  // Prefer an explicit meeting URL; fall back to the public booking page.
  const meetingUrl: string | null =
    d.meetingUrl ||
    (typeof d.location === "string" && /^https?:\/\//.test(d.location) ? d.location : null) ||
    (uid ? `https://cal.com/booking/${uid}` : null);

  return { uid, meetingUrl };
}
