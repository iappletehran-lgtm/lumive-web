"use client";

import { Reveal } from "../Reveal";
import { LumiVoiceChat } from "@/components/voice/LumiVoiceChat";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * "Talk to Lumi" — a voice-first way to reach the assistant, placed above the
 * Contact section. Mist-white surface, brand-recoloured voice input (sapphire mic,
 * teal visualizer), and the conversation transcript below. Bilingual via
 * useLanguage(). Content-only; reuses existing tokens (no new visual system).
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
          <div className="mt-10">
            <LumiVoiceChat />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
