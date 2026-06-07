import { createHash } from "node:crypto";
import type { ChatMessage } from "@/lib/assistant/types";

/**
 * Conversation + lead store for the WhatsApp agent.
 *
 * Privacy model (per requirements — "store metadata, not sensitive content"):
 *  - PERSISTENT LOG (logEvent): only metadata — a one-way hashed conversation id,
 *    lead status, turn count, timestamps. No message bodies, no raw phone number.
 *  - EPHEMERAL SESSION (in-memory Map): holds the recent message text ONLY to give
 *    the LLM context for the next reply, and the raw phone ONLY to address the
 *    reply. It is never logged and expires after inactivity.
 *
 * This is an in-memory implementation suitable for a single instance. For
 * production scale, back `sessions` and `processed` with Redis/DB (same API).
 */

export type LeadStatus = "cold" | "warm" | "hot" | "qualified";

export interface Conversation {
  /** one-way hash of the phone — safe to log */
  id: string;
  status: LeadStatus;
  turns: number;
  firstSeen: number;
  lastSeen: number;
  bookingShared: boolean;
  /** ephemeral context for the LLM — NOT logged, capped + TTL'd */
  history: ChatMessage[];
}

const HISTORY_MAX = 12;
const TTL_MS = 1000 * 60 * 60 * 6; // 6h inactivity → forget session content

const sessions = new Map<string, Conversation>(); // key: raw phone (ephemeral)
const processed = new Map<string, number>(); // message id → ts (dedupe Meta retries)

function sweep() {
  const now = Date.now();
  for (const [k, c] of sessions) if (now - c.lastSeen > TTL_MS) sessions.delete(k);
  for (const [k, ts] of processed) if (now - ts > TTL_MS) processed.delete(k);
}

/** Stable, non-reversible id for logging (no raw PII in logs). */
export function convId(phone: string): string {
  return createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

/** Idempotency guard against Meta webhook retries. */
export function alreadyProcessed(messageId: string): boolean {
  sweep();
  if (processed.has(messageId)) return true;
  processed.set(messageId, Date.now());
  return false;
}

export function getConversation(phone: string): Conversation {
  let c = sessions.get(phone);
  if (!c) {
    const now = Date.now();
    c = { id: convId(phone), status: "cold", turns: 0, firstSeen: now, lastSeen: now, bookingShared: false, history: [] };
    sessions.set(phone, c);
  }
  return c;
}

export function pushMessage(conv: Conversation, role: ChatMessage["role"], content: string) {
  conv.history.push({ role, content });
  if (conv.history.length > HISTORY_MAX) conv.history = conv.history.slice(-HISTORY_MAX);
  conv.lastSeen = Date.now();
}

/** Persistent, content-free metadata log. Swap console for your sink (DB/CRM). */
export function logEvent(conv: Conversation, event: string, extra: Record<string, unknown> = {}) {
  console.info(
    "[whatsapp]",
    JSON.stringify({
      event,
      conv: conv.id,
      status: conv.status,
      turns: conv.turns,
      bookingShared: conv.bookingShared,
      at: new Date().toISOString(),
      ...extra,
    })
  );
}
