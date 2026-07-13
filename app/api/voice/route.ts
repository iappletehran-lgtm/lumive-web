import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createAdminClient } from "@/lib/supabase/admin";

// Node.js runtime (default). Edge was removed — a hanging outbound fetch on edge
// gave no way to recover, and the fixes below (AbortController timeouts, waitUntil)
// all work on the Node serverless runtime.
export const runtime = "nodejs";
export const maxDuration = 20;

// Fastest model available on OpenRouter (gemini-2.0-flash-exp is Google-AI-Studio
// only), with a tiny token budget so voice replies are short and quick to speak.
const VOICE_MODEL = "google/gemini-2.5-flash-lite";
const VOICE_MAX_TOKENS = 90;
// Per-model cap: the whole model chain can't stall the response.
const LLM_TIMEOUT_MS = 8000;
const TTS_TIMEOUT_MS = 5000;
const WARMUP_TIMEOUT_MS = 2500;

// Keep spoken replies short — 1–2 sentences reads/speaks far faster than a paragraph.
const VOICE_BREVITY =
  "This is a spoken voice conversation. Answer in 1–2 short sentences, under 40 words. Be direct and natural.";

// Played when the model times out or fails — a natural "say that again" prompt
// rather than a dead end.
const FALLBACK: Record<"en" | "fa", string> = {
  en: "I didn't catch that. Could you say that again?",
  fa: "متوجه نشدم. می‌تونی دوباره بگی؟",
};

/**
 * Voice endpoint — single round trip: transcript → Lumi (fast model) → ElevenLabs
 * audio, streamed straight back. No history/memory is loaded (single turn); the LLM
 * call runs in parallel with an ElevenLabs connection warm-up; logging happens in
 * the background (waitUntil) and never blocks the response. Every outbound fetch has
 * a timeout so nothing can hang. GET is used by the <audio> element for progressive
 * playback; POST mirrors it.
 */
async function handle(transcript: string, sessionId: string, language: "en" | "fa"): Promise<Response> {
  const userMsg: LumiMessage = { role: "user", content: transcript };

  // LLM (capped at 8s across the model chain) + ElevenLabs warm-up in parallel.
  const [reply] = await Promise.all([
    callLumi(
      [userMsg],
      language === "fa" ? "fa" : undefined,
      VOICE_BREVITY,
      VOICE_MAX_TOKENS,
      VOICE_MODEL,
      LLM_TIMEOUT_MS
    ),
    warmUpElevenLabs(),
  ]);
  const replyText = reply || FALLBACK[language];

  // Log in the background — never awaited on the response path.
  waitUntil(logTurn(sessionId, language, userMsg, { role: "assistant", content: replyText }));

  return streamTts(replyText, language);
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  try {
    await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": key },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    /* warm-up is best-effort */
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Stream ElevenLabs Flash audio for the reply text straight to the client. Aborts
 * after TTS_TIMEOUT_MS if ElevenLabs doesn't start responding; on any failure falls
 * back to a spoken "say that again" prompt so the user always hears something.
 */
async function streamTts(text: string, language: "en" | "fa"): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const clean = text.replace(/\/book/g, "book").trim();
  if (!key || !voiceId || !clean) return new NextResponse(null, { status: 204 });

  const attempt = async (say: string): Promise<Response | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    try {
      const el = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
        body: JSON.stringify({
          text: say,
          model_id: "eleven_flash_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!el.ok || !el.body) {
        console.warn("[voice] ElevenLabs", el.status);
        return null;
      }
      return new NextResponse(el.body, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    } catch (err) {
      console.warn("[voice] TTS failed:", (err as Error).message);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // Try the real reply; if TTS fails, speak the fallback prompt instead of silence.
  const primary = await attempt(clean);
  if (primary) return primary;
  const backup = clean === FALLBACK[language] ? null : await attempt(FALLBACK[language]);
  return backup || new NextResponse(null, { status: 204 });
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
