"use client";

import { Reveal } from "../Reveal";
import { LumiVoiceAgent } from "@/components/voice/LumiVoiceAgent";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * "Talk to Lumi" — a voice-first way to reach the assistant, placed above the
 * Contact section. Mist-white surface, bilingual via useLanguage(). The voice
 * experience is a custom UI (<LumiVoiceAgent> → <VoiceChat>) wired to the
 * ElevenLabs conversation SDK. Content-only; reuses existing tokens.
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
          <div className="mx-auto mt-6 w-full max-w-md">
            <LumiVoiceAgent />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
