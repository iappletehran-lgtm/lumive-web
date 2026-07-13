import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureLead } from "@/lib/assistant/leads";

export const runtime = "nodejs";

const CONTEXT_WINDOW = 10;
const FALLBACK: Record<"en" | "fa", string> = {
  en: "I'm having trouble responding right now. You can book a 30-minute strategy call at /book and the team will help directly.",
  fa: "در پاسخ‌دادن مشکلی پیش آمده. می‌توانید یک تماس استراتژیک 30 دقیقه‌ای در /book رزرو کنید تا تیم مستقیم کمک کند.",
};

/**
 * Voice chat endpoint. Receives a speech transcript, replies via the same callLumi
 * brain (Gemini 2.5 Flash → Gemma 4 → GPT-4o mini fallback chain), and returns
 * { reply }. Audio is generated separately by /api/voice/speech so it never blocks
 * the text reply. The conversation is logged to chat_logs (session "voice_<id>", so
 * voice sessions are distinguishable, like "telegram_"). A `lead` payload from the
 * form card is saved to the leads table with source "voice". Logging is
 * fire-and-forget.
 */
export async function POST(req: NextRequest) {
  let body: {
    transcript?: string;
    session_id?: string;
    lang?: string;
    lead?: { full_name?: string; phone_number?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const language: "en" | "fa" = body.lang === "fa" ? "fa" : "en";
  const sessionId = typeof body.session_id === "string" ? body.session_id : "";

  // Lead submission from the voice form card (full_name + phone_number).
  if (body.lead && typeof body.lead === "object") {
    const name = body.lead.full_name?.trim() || null;
    const phone = body.lead.phone_number?.trim() || null;
    if (name || phone) {
      waitUntil(
        captureLead({
          name,
          email: null,
          phone,
          source: "voice",
          language,
          message: "Captured via voice chat",
        })
      );
    }
    return NextResponse.json({ ok: true });
  }

  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: "No transcript." }, { status: 400 });
  }

  const stored = await readConversation(sessionId);
  const userMsg: LumiMessage = { role: "user", content: transcript };
  const context = [...stored, userMsg].slice(-CONTEXT_WINDOW);

  const reply = (await callLumi(context, language === "fa" ? "fa" : undefined)) || FALLBACK[language];

  const full: LumiMessage[] = [...stored, userMsg, { role: "assistant", content: reply }];
  waitUntil(logConversation(sessionId, language, full));

  // Audio is fetched separately from /api/voice/speech so it never blocks the reply.
  return NextResponse.json({ reply });
}

/** Read the stored conversation for a session from chat_logs (service role). */
async function readConversation(sessionId: string): Promise<LumiMessage[]> {
  if (!sessionId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("chat_logs").select("messages").eq("session_id", sessionId).maybeSingle();
    return Array.isArray(data?.messages) ? (data!.messages as LumiMessage[]) : [];
  } catch (err) {
    console.warn("[voice] readConversation failed:", (err as Error).message);
    return [];
  }
}

/** Upsert the full conversation into chat_logs (atomic on session_id). */
async function logConversation(sessionId: string, language: "en" | "fa", messages: LumiMessage[]) {
  if (!sessionId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
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
    console.error("[voice] conversation log failed:", (err as Error).message);
  }
}
