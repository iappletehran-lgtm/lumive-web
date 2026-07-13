/**
 * Language-aware date/time formatting for the admin panel. Persian uses Gregorian
 * month/day names (ca-gregory) with Western/Latin numerals (nu-latn) — so the
 * month reads "ژوئیه" not "Jul", while numbers stay Western per the brand rule.
 * Dates are rendered LTR at the call sites.
 */

function locale(lang: string) {
  return lang === "fa" ? "fa-u-ca-gregory-nu-latn" : "en-GB";
}

/** e.g. "20 Jul 2026" (en) / "20 ژوئیه 2026" (fa). */
export function fmtDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** 24-hour time, e.g. "09:15" (both languages, Western numerals). */
export function fmtTime(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
