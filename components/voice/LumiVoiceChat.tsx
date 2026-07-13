"use client";

import { useCallback, useEffect, useRef } from "react";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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

// A tiny valid silent WAV. Played once inside the first user gesture to "unlock"
// audio, so streamed playback (which starts after an async step) is allowed by
// browser autoplay policies (Chrome + Safari + iOS).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

/**
 * Minimal voice surface — just the microphone + visualizer. The visitor speaks,
 * Lumi replies, and the reply is spoken aloud (ElevenLabs, streamed). Nothing is
 * shown as text: no transcript, no input, no lead form.
 */
export function LumiVoiceChat() {
  const { lang } = useLanguage();

  const sessionRef = useRef<string>("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const sentRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef<boolean>(false);
  const busyRef = useRef<boolean>(false);

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = `voice_${crypto.randomUUID()}`;
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
    };
  }, []);

  // Unlock audio inside a real user gesture (first tap/click on the mic area) by
  // playing the silent WAV, so the streamed reply audio is allowed to play later.
  const unlockAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a || unlockedRef.current) return;
    try {
      a.src = SILENT_WAV;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => { a.pause(); unlockedRef.current = true; }).catch(() => { /* retry next gesture */ });
      }
    } catch { /* ignore */ }
  }, []);

  // Stream the ElevenLabs audio straight into the shared <audio> element (GET so it
  // plays progressively). Never blocks anything; logs a play() rejection if any.
  const speak = useCallback((text: string, spoken: "en" | "fa") => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.src = `/api/voice/speech?lang=${spoken}&text=${encodeURIComponent(text)}`;
    a.load();
    a.play().catch((err) => console.error("Audio play error:", err));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busyRef.current) return;
      busyRef.current = true;
      const spoken: "en" | "fa" = isFarsi(message) ? "fa" : "en";
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ transcript: message, session_id: sessionRef.current, lang: spoken }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.reply) speak(data.reply, spoken);
      } catch {
        /* silent — voice-only surface */
      } finally {
        busyRef.current = false;
      }
    },
    [speak]
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
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalRef.current += e.results[i][0]?.transcript ?? "";
        }
      };
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
      /* recognition unavailable */
    }
  }, [lang, send]);

  const stopRecording = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* onend still fires */ }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center" onPointerDown={unlockAudio}>
      {/* Shared audio element — unlocked on the first gesture, speaks every reply. */}
      <audio ref={audioRef} preload="auto" className="hidden" aria-hidden />
      <AIVoiceInput onStart={startRecording} onStop={stopRecording} visualizerBars={40} />
    </div>
  );
}
