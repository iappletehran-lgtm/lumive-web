/**
 * Lead capture for the Lumi assistant — shared by the web chat (/api/chat) and the
 * Telegram bot (/api/telegram). SERVER ONLY (service-role insert + Resend email).
 *
 * Flow: when a "booking signal" is detected and we have not asked yet, Lumi appends
 * LEAD_ASK to its reply. On the visitor's next message (detected because the most
 * recent assistant turn contains the ask), we extract name/email/phone, save to the
 * leads table, and email the admin. State lives in the conversation itself, so it
 * works statelessly across serverless invocations.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotification } from "@/lib/email";
import type { LumiMessage } from "@/lib/assistant/lumi";

export const LEAD_ASK: Record<"en" | "fa", string> = {
  en: "Before I continue — could I get your name and phone number so I can follow up with you?",
  fa: "قبل از ادامه — اسم و شماره تلفنتون رو می‌تونم داشته باشم تا بتونم پیگیری کنم؟",
};

// Stable substrings to recognise the ask inside stored history (both languages).
const ASK_MARKERS = ["could I get your name", "اسم و شماره تلفنتون"];

function containsLeadAsk(text: string): boolean {
  return ASK_MARKERS.some((m) => text.includes(m));
}

/** True if the most recent assistant turn was the lead-ask (→ this user msg is the reply). */
export function lastAssistantWasLeadAsk(messages: LumiMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return containsLeadAsk(messages[i].content);
  }
  return false;
}

/** True if the lead-ask has already been sent at any point (→ do not ask again). */
export function leadAlreadyAsked(messages: LumiMessage[]): boolean {
  return messages.some((m) => m.role === "assistant" && containsLeadAsk(m.content));
}

/**
 * Whether to ask for contact details on this turn. Timing is deliberately tied to
 * the conversation length — the ask fires at the 3rd exchange (3rd user message),
 * never earlier, so it never interrupts the first couple of turns. `userText`/
 * `reply` are kept in the signature for call-site compatibility.
 */
export function detectBookingSignal(userText: string, reply: string, userMsgCount: number): boolean {
  return userMsgCount >= 3;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/;

/** Normalize Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Western 0-9. */
function toWesternDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Best-effort extraction of name/email/phone from a free-text reply. */
export function extractLead(input: string): { name: string | null; email: string | null; phone: string | null } {
  const text = toWesternDigits(input); // also keeps stored phone in Western numerals
  const email = (text.match(EMAIL_RE) || [])[0] || null;
  // Strip the email BEFORE matching the phone, so digits inside an address
  // (e.g. "name1990@x.com") are never mistaken for a phone number.
  let rest = email ? text.replace(email, " ") : text;
  const phone = (rest.match(PHONE_RE) || [])[0]?.replace(/\s+/g, " ").trim() || null;
  if (phone) rest = rest.split(phone).join(" ");
  rest = rest
    .replace(/[,;|/\n\r]+/g, " ")
    .replace(/(نام|اسم)\s*(من|ام)?/g, " ") // "my name (is)" in Persian
    .replace(/\b(my\s+)?(name|full name|email|e-?mail|phone|number|mobile|tel|cell)\b\s*(is|:|=)?/gi, " ")
    .replace(/(ایمیل|شماره|تلفن|موبایل)\s*[:：]?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // drop dangling connectors left behind from phrases like "X and phone Y"
    .replace(/^(and|&|و|is|هست|هستم|است)\s+/i, "")
    .replace(/\s+(and|&|و|is|هست|هستم|است)$/i, "")
    .trim();
  const name = rest ? rest.slice(0, 80).trim() : null;
  return { name: name || null, email, phone };
}

/** Short summary stored with the lead + emailed — the visitor's opening message. */
export function conversationSummary(messages: LumiMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  return (firstUser?.content || "").slice(0, 1000);
}

/**
 * Persist a lead (service role) and notify the admin by email. Best-effort: no-ops
 * without Supabase env, requires at least an email or phone, never throws.
 */
export async function captureLead(data: {
  name: string | null;
  email: string | null;
  phone: string | null;
  source: "chat" | "telegram" | "voice";
  language: "en" | "fa";
  message: string;
  company?: string | null;
  industry?: string | null;
}): Promise<void> {
  if (!data.email && !data.phone) return; // nothing useful to capture
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("leads").insert({
      full_name: data.name,
      email: data.email,
      phone_number: data.phone,
      company: data.company ?? null,
      industry: data.industry ?? null,
      message: data.message,
      source: data.source,
      language: data.language,
    });
    if (error) throw error;
  } catch (err) {
    console.error("[leads] insert failed:", (err as Error).message);
    return;
  }

  try {
    await sendLeadNotification({
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company ?? null,
      source: data.source,
      language: data.language,
      message: data.message,
    });
  } catch (err) {
    console.error("[leads] notification failed:", (err as Error).message);
  }
}
