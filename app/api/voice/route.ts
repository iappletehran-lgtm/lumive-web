import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createAdminClient } from "@/lib/supabase/admin";

// Edge = no cold start, runs close to the user. All work here is fetch-based
// (OpenRouter, ElevenLabs, Supabase REST), which is edge-compatible.
export const runtime = "edge";

// Fastest model available on OpenRouter (gemini-2.0-flash-exp is Google-AI-Studio
// only), with a tiny token budget so voice replies are short and quick to speak.
const VOICE_MODEL = "google/gemini-2.5-flash-lite";
const VOICE_MAX_TOKENS = 100;

const FALLBACK: Record<"en" | "fa", string> = {
  en: "I'm having trouble responding right now. You can book a call at /book.",
  fa: "در پاسخ‌دادن مشکلی پیش آمده. می‌توانید یک تماس در /book رزرو کنید.",
};

/**
 * Voice endpoint — single round trip: transcript → Lumi (fast model) → ElevenLabs
 * audio, streamed straight back. No history/memory is loaded (single turn); the LLM
 * call runs in parallel with an ElevenLabs connection warm-up; logging happens in
 * the background (waitUntil) and never blocks the response. GET is used by the
 * <audio> element for progressive playback; POST mirrors it.
 */
async function handle(transcript: string, sessionId: string, language: "en" | "fa"): Promise<Response> {
  const userMsg: LumiMessage = { role: "user", content: transcript };

  // LLM + ElevenLabs warm-up in parallel; then immediately synthesize the reply.
  const [reply] = await Promise.all([
    callLumi([userMsg], language === "fa" ? "fa" : undefined, undefined, VOICE_MAX_TOKENS, VOICE_MODEL),
    warmUpElevenLabs(),
  ]);
  const replyText = reply || FALLBACK[language];

  // Log in the background — never awaited on the response path.
  waitUntil(logTurn(sessionId, language, userMsg, { role: "assistant", content: replyText }));

  return streamTts(replyText);
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const transcript = (p.get("transcript") || "").trim();
  const language: "en" | "fa" = p.get("lang") === "fa" ? "fa" : "en";
  const sessionId = p.get("session_id") || "";
  if (!transcript) return NextResponse.json({ error: "No transcript." }, { status: 400 });
  return handle(transcript, sessionId, language);
}

export async function POST(req: NextRequest) {
  let body: { transcript?: string; session_id?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const transcript = (body.transcript || "").trim();
  const language: "en" | "fa" = body.lang === "fa" ? "fa" : "en";
  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  if (!transcript) return NextResponse.json({ error: "No transcript." }, { status: 400 });
  return handle(transcript, sessionId, language);
}

/** Open a connection to ElevenLabs while the LLM runs, so TTS starts warm. */
async function warmUpElevenLabs(): Promise<void> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.elevenlabs.io/v1/models", { headers: { "xi-api-key": key }, cache: "no-store" });
  } catch {
    /* warm-up is best-effort */
  }
}

/** Stream ElevenLabs Flash audio for the reply text straight to the client. */
async function streamTts(text: string): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const clean = text.replace(/\/book/g, "book").trim();
  if (!key || !voiceId || !clean) return new NextResponse(null, { status: 204 });
  try {
    const el = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      cache: "no-store",
    });
    if (!el.ok || !el.body) return new NextResponse(null, { status: 204 });
    return new NextResponse(el.body, { status: 200, headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

/** Log the turn to chat_logs (session "voice_<id>"). No history read — single turn. */
async function logTurn(sessionId: string, language: "en" | "fa", userMsg: LumiMessage, botMsg: LumiMessage) {
  if (!sessionId || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("chat_logs")
      .upsert(
        { session_id: sessionId, language, user_id: null, messages: [userMsg, botMsg], updated_at: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("[voice] log failed:", (err as Error).message);
  }
}
