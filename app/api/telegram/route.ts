import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage, detectLang } from "@/lib/telegram";
import {
  LEAD_ASK,
  captureLead,
  conversationSummary,
  detectBookingSignal,
  extractLead,
  lastAssistantWasLeadAsk,
  leadAlreadyAsked,
} from "@/lib/assistant/leads";

export const runtime = "nodejs";

// Context windows: keep the last 10 turns warm in memory (per Vercel instance);
// on a cold instance, seed context from the last 5 messages in chat_logs.
const MEMORY_LIMIT = 10;
const COLD_SEED = 5;
const CONTEXT_WINDOW = 10;

// Warm-instance cache (chat_id → recent turns). Best-effort only: serverless
// instances are short-lived, so chat_logs is the source of truth for history.
const memory = new Map<string, LumiMessage[]>();

const START_MESSAGE =
  "سلام، من لومی هستم — دستیار Lumive AI. چطور می‌تونم کمکت کنم؟ / Hi, I'm Lumi — Lumive AI's assistant. How can I help?";

const HELP_MESSAGE =
  "لومی به شما کمک می‌کند بفهمید هوش مصنوعی چگونه می‌تواند در کسب‌وکارتان کار کند — گردش‌کارهای خودکار، پذیرشگر هوش مصنوعی، پشتیبانی تصمیم و عامل‌های سفارشی. هر سوالی دارید بپرسید، یا یک تماس استراتژیک 30 دقیقه‌ای رزرو کنید: https://lumive-web.vercel.app/book\n\n" +
  "Lumi helps you understand how AI can work in your business — automated workflows, AI receptionists, decision-support, and custom agents. Ask me anything, or book a 30-minute strategy call: https://lumive-web.vercel.app/book";

const FALLBACK = {
  en: "I'm having trouble responding right now. You can book a 30-minute strategy call at https://lumive-web.vercel.app/book and the team will help directly.",
  fa: "در پاسخ‌دادن مشکلی پیش آمده. می‌توانید یک تماس استراتژیک 30 دقیقه‌ای در https://lumive-web.vercel.app/book رزرو کنید تا تیم مستقیم کمک کند.",
};

/**
 * Telegram webhook for the Lumi bot. Receives an update, replies via the same
 * callLumi() brain the web chat uses, and logs the conversation to chat_logs
 * (session_id "telegram_<chat_id>") so it shows up in /admin. Always returns 200
 * so Telegram does not retry.
 */
export async function POST(req: NextRequest) {
  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const message = update?.message;
    const chatId = message?.chat?.id;
    const text = typeof message?.text === "string" ? message.text.trim() : "";

    // Ignore non-text updates (photos, edits, joins, …) — nothing to reply to.
    if (!chatId || !text) return NextResponse.json({ ok: true });

    const key = `telegram_${chatId}`;
    const lang = detectLang(text);

    // Full stored history (for append + persistence) — never truncated.
    const stored = await readConversation(key);
    const userMsg: LumiMessage = { role: "user", content: text };

    let reply: string;
    if (text.startsWith("/start")) {
      reply = START_MESSAGE;
    } else if (text.startsWith("/help")) {
      reply = HELP_MESSAGE;
    } else if (lastAssistantWasLeadAsk(stored)) {
      // The previous bot turn asked for contact details — capture them now.
      const lead = extractLead(text);
      if (lead.email || lead.phone) {
        waitUntil(
          captureLead({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: "telegram",
            language: lang,
            message: conversationSummary([...stored, userMsg]),
          })
        );
      }
      const base = memory.get(key) ?? stored.slice(-COLD_SEED);
      const context = [...base, userMsg].slice(-CONTEXT_WINDOW);
      reply = (await callLumi(context, lang === "fa" ? "fa" : undefined)) || FALLBACK[lang];
    } else {
      // Context: warm memory (last 10) if present, else last 5 from chat_logs.
      const base = memory.get(key) ?? stored.slice(-COLD_SEED);
      const context = [...base, userMsg].slice(-CONTEXT_WINDOW);
      reply = (await callLumi(context, lang === "fa" ? "fa" : undefined)) || FALLBACK[lang];
      // Natural lead-ask on a booking signal, at most once per conversation.
      const userMsgCount = stored.filter((m) => m.role === "user").length + 1;
      if (detectBookingSignal(text, reply, userMsgCount) && !leadAlreadyAsked(stored)) {
        reply = `${reply}\n\n${LEAD_ASK[lang]}`;
      }
    }

    await sendTelegramMessage(chatId, reply);

    // Append this turn to the full conversation; update memory + persist.
    const full: LumiMessage[] = [...stored, userMsg, { role: "assistant", content: reply }];
    memory.set(key, full.slice(-MEMORY_LIMIT));
    waitUntil(upsertConversation(key, lang, full));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram] handler error:", (err as Error).message);
    return NextResponse.json({ ok: true });
  }
}

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

/** Read the stored conversation for a session from chat_logs (service role). */
async function readConversation(sessionId: string): Promise<LumiMessage[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("chat_logs")
      .select("messages")
      .eq("session_id", sessionId)
      .maybeSingle();
    return Array.isArray(data?.messages) ? (data!.messages as LumiMessage[]) : [];
  } catch (err) {
    console.warn("[telegram] readConversation failed:", (err as Error).message);
    return [];
  }
}

/** Upsert the full conversation into chat_logs (atomic on session_id). */
async function upsertConversation(sessionId: string, language: "en" | "fa", messages: LumiMessage[]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("chat_logs")
      .upsert(
        { session_id: sessionId, language, user_id: null, messages, updated_at: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("[telegram] conversation log failed:", (err as Error).message);
  }
}
