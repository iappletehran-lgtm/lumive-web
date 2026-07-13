/**
 * ElevenLabs text-to-speech. SERVER ONLY — reads ELEVENLABS_API_KEY /
 * ELEVENLABS_VOICE_ID, which must never reach the browser. Returns an MP3 buffer
 * (or null on any failure, so callers degrade to text-only silently).
 */
export async function textToSpeech(text: string, lang: "en" | "fa"): Promise<Buffer | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const clean = (text || "").replace(/\/book/g, "book").trim();
  if (!key || !voiceId || !clean) return null;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_turbo_v2_5",
        // Turbo v2.5 supports explicit language codes; set "fa" for Persian.
        ...(lang === "fa" ? { language_code: "fa" } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[elevenlabs] TTS", res.status, await res.text().catch(() => ""));
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn("[elevenlabs] TTS failed:", (err as Error).message);
    return null;
  }
}
