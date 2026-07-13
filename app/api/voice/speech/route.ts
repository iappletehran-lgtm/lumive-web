import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * ElevenLabs text-to-speech for the voice chat. Streams the audio straight from
 * ElevenLabs' /stream endpoint to the client (lower latency — playback can begin
 * before the full clip is generated). The voice id and API key are read from env
 * and never leave the server.
 *
 * GET  /api/voice/speech?text=…&lang=…   → used by the <audio> element for
 *                                          progressive streaming playback.
 * POST /api/voice/speech { text, lang }  → same audio, JSON body.
 *
 * No language_code is sent — it can distort the voice; the model auto-detects the
 * language from the text (works for both English and Persian).
 */
async function synthesize(text: string): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const clean = (text || "").replace(/\/book/g, "book").trim();
  if (!key || !voiceId || !clean) return new NextResponse(null, { status: 204 });

  try {
    const el = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      cache: "no-store",
    });
    if (!el.ok || !el.body) {
      console.warn("[voice/speech] ElevenLabs", el.status, await el.text().catch(() => ""));
      return new NextResponse(null, { status: 204 });
    }
    // Pipe ElevenLabs' stream straight through to the client.
    return new NextResponse(el.body, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.warn("[voice/speech] TTS failed:", (err as Error).message);
    return new NextResponse(null, { status: 204 });
  }
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") || "";
  if (!text.trim()) return NextResponse.json({ error: "No text." }, { status: 400 });
  return synthesize(text);
}

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) return NextResponse.json({ error: "No text." }, { status: 400 });
  return synthesize(text);
}
