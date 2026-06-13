/**
 * Central contact configuration. Single source of truth for the WhatsApp and
 * Telegram channels used across the footer, CTA sections, and the assistant.
 *
 * PLACEHOLDERS — replace with real details before launch.
 */
export const CONTACT = {
  /**
   * International format, digits only, no "+", spaces, or leading zero
   * (wa.me requirement). e.g. UK 07700 900123 → "447700900123".
   * waLink() sanitizes defensively, but store it clean.
   */
  whatsappNumber: "905313352839", // Turkey +90 531 335 28 39
  /** Telegram username without the "@". */
  telegramHandle: "Lumiveai", // https://t.me/Lumiveai
  email: "hello@lumive.ai", // ⚠️ PLACEHOLDER
} as const;

/**
 * Public scheduling page (Cal.com). Every "Book a 30-minute call" CTA links
 * here and opens it in a new tab — the single source for the booking flow.
 */
export const BOOKING_URL = "https://cal.com/lumive-30min";

/**
 * On-site paid consultation funnel (the /book page — $50 USDT strategy call).
 * Internal route, so it navigates in the same tab. Marketing CTAs point here;
 * the free intro call (BOOKING_URL, Cal.com) stays on the contact/assistant flows.
 */
export const BOOK_URL = "/book";


/** Official social profiles. Handle is @lumiveai across platforms (brand rule). PLACEHOLDER URLs. */
export const SOCIALS = {
  linkedin: "https://www.linkedin.com/company/lumiveai",
  youtube: "https://www.youtube.com/@lumiveai",
  instagram: "https://www.instagram.com/lumiveai",
} as const;

/** Booking-intent pre-fill (brand voice: calm, specific, no exclamation marks). */
const DEFAULT_MESSAGE =
  "Hi Lumive AI, I'd like to book a 30-minute call about implementing AI in my business.";

/** Strip anything that breaks a wa.me deep link: non-digits and any leading zeros. */
function sanitizeWaNumber(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+/, "");
}

/** Direct WhatsApp chat deep link with a booking-intent pre-filled message. */
export function waLink(message: string = DEFAULT_MESSAGE): string {
  return `https://wa.me/${sanitizeWaNumber(CONTACT.whatsappNumber)}?text=${encodeURIComponent(message)}`;
}

/** Direct Telegram profile/chat link (username without the leading "@"). */
export function tgLink(): string {
  return `https://t.me/${CONTACT.telegramHandle.replace(/^@/, "")}`;
}
