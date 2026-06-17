/**
 * Telegram Bot helpers for the Lumi Telegram bot. SERVER ONLY (reads
 * TELEGRAM_BOT_TOKEN). The bot reuses the exact same Lumi brain as the web chat
 * (lib/assistant/lumi.ts) — this module only handles the Telegram transport and
 * lightweight language detection.
 */

const API_BASE = "https://api.telegram.org";

/** Persian/Arabic script range — any match means the user wrote in Farsi. */
const FARSI_RANGE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/** Detect reply language: Persian/Arabic characters → "fa", otherwise "en". */
export function detectLang(text: string): "en" | "fa" {
  return FARSI_RANGE.test(text || "") ? "fa" : "en";
}

/**
 * Send a plain-text message to a Telegram chat. Best-effort: returns false (and
 * logs) on any failure so the webhook handler never throws. Plain text — no
 * parse_mode — so URLs and Persian render cleanly without escaping.
 */
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — cannot send");
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[telegram] sendMessage", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[telegram] sendMessage failed:", (err as Error).message);
    return false;
  }
}
