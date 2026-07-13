"use client";

import Script from "next/script";
import { Reveal } from "../Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** ElevenLabs Conversational AI agent for the "Talk to Lumi" section. */
const ELEVENLABS_AGENT_ID = "agent_1201kxdete4df3ctxck96xhs82qh";

/**
 * "Talk to Lumi" — a voice-first way to reach the assistant, placed above the
 * Contact section. Mist-white surface, bilingual via useLanguage(). The voice
 * experience is the official ElevenLabs Conversational AI widget (it handles mic,
 * speech-to-text, the LLM turn, and speech playback itself). Content-only; reuses
 * existing tokens (no new visual system).
 */
export function VoiceChat() {
  const { t } = useLanguage();
  return (
    <section id="voice" className="bg-mist">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
              {t.voice.title}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-steel sm:text-base">
              {t.voice.subtitle}
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 flex justify-center">
            <elevenlabs-convai agent-id={ELEVENLABS_AGENT_ID} />
          </div>
        </Reveal>
      </div>

      {/* Loads the custom element; afterInteractive so it never blocks first paint. */}
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
    </section>
  );
}
