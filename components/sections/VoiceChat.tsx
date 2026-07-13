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
 * speech-to-text, the LLM turn, and speech playback itself).
 *
 * The widget is architecturally a `position: fixed` floating launcher (`:host`
 * fixes to the viewport). To embed it INSIDE this section — centered below the
 * subtitle rather than floating in a corner — the widget sits in a wrapper that
 * carries a CSS `transform`. A transformed ancestor becomes the containing block
 * for `position: fixed` descendants, so the widget fills THIS box instead of the
 * viewport. The box is sized to the expanded panel; the panel is responsive and
 * tracks the box (box − 32px inset per side), so it stays contained on mobile too.
 * `default-expanded` shows the panel in place (verified: no mic request until the
 * visitor clicks "Start a call").
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

        {/* Transformed containing block: embeds the fixed-position widget here,
            centered below the subtitle. Do NOT remove the transform — without it
            the widget escapes to the viewport corner. */}
        <div
          className="relative mx-auto mt-10 h-[600px] w-full max-w-[460px]"
          style={{ transform: "translateZ(0)" }}
        >
          <elevenlabs-convai
            agent-id={ELEVENLABS_AGENT_ID}
            variant="expanded"
            default-expanded="true"
            placement="bottom"
          />
        </div>
      </div>

      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
      />
    </section>
  );
}
