import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/elevenlabs";

export const runtime = "nodejs";

/**
 * Text-to-speech for the voice chat. Receives { text, lang }, generates audio via
 * ElevenLabs (server-side key only), and streams back the MP3. Decoupled from
 * /api/voice so audio is fetched separately and never blocks the text reply.
 * Returns 204 (no body) when audio can't be produced — the client just skips it.
 */
export async function POST(req: NextRequest) {
  let body: { text?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const lang: "en" | "fa" = body.lang === "fa" ? "fa" : "en";
  if (!text.trim()) return NextResponse.json({ error: "No text." }, { status: 400 });

  const audio = await textToSpeech(text, lang);
  if (!audio) return new NextResponse(null, { status: 204 });

  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
