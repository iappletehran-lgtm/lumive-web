"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Turn = { role: "user" | "assistant"; text: string };

// Minimal Web Speech API typings (not in the standard DOM lib).
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Persian/Arabic characters → the visitor spoke Farsi. */
const isFarsi = (t: string) => /[؀-ۿ]/.test(t);

/**
 * Voice chat surface: records speech (Web Speech API), sends the transcript to
 * /api/voice, plays the ElevenLabs audio reply automatically, and shows the
 * conversation. After the 3rd exchange it surfaces a lead form (name + phone).
 * Falls back to a text input when speech recognition is unavailable. Bilingual.
 */
export function LumiVoiceChat() {
  const { t, lang } = useLanguage();
  const v = t.voice;

  const [supported, setSupported] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [live, setLive] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [typed, setTyped] = useState("");
  const [showLead, setShowLead] = useState(false);
  const [leadDone, setLeadDone] = useState(false);

  const sessionRef = useRef<string>("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const sentRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const exchangesRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    if (!sessionRef.current) sessionRef.current = `voice_${crypto.randomUUID()}`;
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, live, thinking]);

  // Fetch the ElevenLabs audio from /api/voice/speech and play it (async — never
  // blocks the UI). If no audio comes back (204/error), the reply is still shown.
  const speak = useCallback(async (text: string, spoken: "en" | "fa") => {
    try {
      const res = await fetch("/api/voice/speech", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang: spoken }),
      });
      if (!res.ok) return; // 204 = no audio available
      const blob = await res.blob();
      if (!blob.size) return;
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      void audio.play().catch(() => { /* autoplay blocked — reply is still shown */ });
    } catch {
      /* audio unavailable — reply is still shown as text */
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || thinking) return;
      const spoken: "en" | "fa" = isFarsi(message) ? "fa" : "en";
      setLive("");
      setTurns((prev) => [...prev, { role: "user", text: message }]);
      setThinking(true);
      setError("");
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript: message, session_id: sessionRef.current, lang: spoken }),
        });
        const data = await res.json().catch(() => ({}));
        const reply: string = data.reply || v.notSupported;
        setTurns((prev) => [...prev, { role: "assistant", text: reply }]);
        void speak(reply, spoken);
        // Show the lead form after the 3rd exchange (once).
        exchangesRef.current += 1;
        if (exchangesRef.current >= 3 && !leadDone) setShowLead(true);
      } catch {
        setError(v.micBlocked);
      } finally {
        setThinking(false);
      }
    },
    [thinking, speak, leadDone, v.notSupported, v.micBlocked]
  );

  const startRecording = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = lang === "fa" ? "fa-IR" : "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      finalRef.current = "";
      sentRef.current = false;
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const chunk = e.results[i][0]?.transcript ?? "";
          if (e.results[i].isFinal) finalRef.current += chunk;
          else interim += chunk;
        }
        setLive(`${finalRef.current} ${interim}`.trim());
      };
      rec.onerror = () => setError(v.micBlocked);
      rec.onend = () => {
        const finalText = finalRef.current.trim();
        if (finalText && !sentRef.current) {
          sentRef.current = true;
          void send(finalText);
        }
      };
      rec.start();
      recRef.current = rec;
    } catch {
      setError(v.micBlocked);
    }
  }, [lang, send, v.micBlocked]);

  const stopRecording = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* onend still fires */ }
  }, []);

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: sessionRef.current,
        lang,
        lead: {
          full_name: String(form.get("full_name") || ""),
          phone_number: String(form.get("phone_number") || ""),
        },
      }),
    }).catch(() => {});
    setLeadDone(true);
    setShowLead(false);
  }

  const hasConversation = turns.length > 0 || live || thinking;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      {supported ? (
        <>
          <AIVoiceInput
            onStart={startRecording}
            onStop={stopRecording}
            visualizerBars={40}
            className="[&_p.text-xs]:hidden [&_span.font-mono]:!text-steel"
          />
          <p className="-mt-1 mb-1 h-4 text-xs text-steel/80">
            {live ? live : thinking ? v.thinking : v.clickToSpeak}
          </p>
        </>
      ) : (
        <p className="max-w-sm px-4 py-6 text-center text-sm text-steel">{v.notSupported}</p>
      )}

      {/* Text fallback / alternative — always available, mobile friendly */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (typed.trim()) { send(typed); setTyped(""); } }}
        className="mt-2 flex w-full max-w-md items-center gap-2"
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={v.inputPlaceholder}
          aria-label={v.orType}
          className="min-w-0 flex-1 rounded-md border border-cloud bg-white/80 px-4 py-2.5 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!typed.trim() || thinking}
          data-sound="cta"
          className="focus-brand shrink-0 rounded-md bg-sapphire px-4 py-2.5 text-sm font-semibold text-mist transition-all hover:brightness-110 disabled:opacity-40"
        >
          {v.send}
        </button>
      </form>

      {error && <p role="alert" className="mt-3 text-sm text-ember">{error}</p>}

      {/* Conversation transcript — user right (sapphire), Lumi left (mist) */}
      {hasConversation && (
        <div
          ref={scrollRef}
          className="mt-6 max-h-72 w-full space-y-3 overflow-y-auto rounded-2xl border border-sapphire/25 bg-mist p-5 shadow-sm"
        >
          {turns.map((turn, i) => {
            const isUser = turn.role === "user";
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <p className={`mb-1 font-mono text-[10px] uppercase tracking-wide ${isUser ? "text-mist/70" : "text-teal"}`} style={isUser ? { textAlign: "right" } : undefined}>
                    {isUser ? v.you : v.lumi}
                  </p>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser ? "rounded-tr-sm bg-sapphire text-mist" : "rounded-tl-sm border border-cloud bg-white text-midnight"
                    }`}
                  >
                    {turn.text}
                  </div>
                </div>
              </div>
            );
          })}
          {live && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-sapphire/60 px-4 py-2.5 text-sm text-mist">{live}</div>
            </div>
          )}
          {thinking && <p className="text-center text-xs text-steel/60">{v.thinking}</p>}
        </div>
      )}

      {/* Lead capture card — shown after the 3rd exchange (name + phone) */}
      {showLead && !leadDone && (
        <form onSubmit={submitLead} className="mt-4 w-full rounded-2xl border border-brass/40 bg-brass/[0.06] p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-sapphire">{v.leadTitle}</p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input name="full_name" placeholder={v.leadName} required className="min-w-0 flex-1 rounded-md border border-cloud bg-white/80 px-3 py-2 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none" />
            <input name="phone_number" placeholder={v.leadPhone} required dir="ltr" className="min-w-0 flex-1 rounded-md border border-cloud bg-white/80 px-3 py-2 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none" />
          </div>
          <button type="submit" data-sound="cta" className="focus-brand glow-cta mt-3 w-full rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-midnight transition-all hover:brightness-95">
            {v.leadSubmit}
          </button>
        </form>
      )}
      {leadDone && (
        <p className="mt-4 w-full rounded-2xl border border-teal/30 bg-teal/[0.08] p-4 text-center text-sm text-teal">
          {v.leadThanks}
        </p>
      )}
    </div>
  );
}
