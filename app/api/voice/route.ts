import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Voice replies are short (max_tokens) so they generate fast and are quick to
// speak. Audio is produced separately by /api/voice/speech.
const VOICE_MAX_TOKENS = 150;

const FALLBACK: Record<"en" | "fa", string> = {
  en: "I'm having trouble responding right now. You can book a call at /book.",
  fa: "در پاسخ‌دادن مشکلی پیش آمده. می‌توانید یک تماس در /book رزرو کنید.",
};

/**
 * Voice chat endpoint. Receives a speech transcript, returns a short { reply } via
 * the callLumi fallback chain with a low max_tokens for speed. The transcript is
 * treated as a single turn (no blocking history read) to minimise latency; the
 * conversation is still logged to chat_logs (session "voice_<id>") off the critical
 * path via waitUntil.
 */
export async function POST(req: NextRequest) {
  let body: { transcript?: string; session_id?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const language: "en" | "fa" = body.lang === "fa" ? "fa" : "en";
  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) return NextResponse.json({ error: "No transcript." }, { status: 400 });

  const userMsg: LumiMessage = { role: "user", content: transcript };
  const reply =
    (await callLumi([userMsg], language === "fa" ? "fa" : undefined, undefined, VOICE_MAX_TOKENS)) ||
    FALLBACK[language];

  // Log off the critical path — reads + appends prior history, then upserts.
  waitUntil(logTurn(sessionId, language, userMsg, { role: "assistant", content: reply }));

  return NextResponse.json({ reply });
}

/** Append this turn to the stored conversation for a session (service role). */
async function logTurn(sessionId: string, language: "en" | "fa", userMsg: LumiMessage, botMsg: LumiMessage) {
  if (!sessionId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("chat_logs").select("messages").eq("session_id", sessionId).maybeSingle();
    const prior = Array.isArray(data?.messages) ? (data!.messages as LumiMessage[]) : [];
    const messages = [...prior, userMsg, botMsg];
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
