"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// Tiny silent WAV — played inside the first gesture to unlock audio, so later
// (async) playback is allowed by browser autoplay policies.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

/**
 * Minimal voice surface — microphone + visualizer only. On the first mic open Lumi
 * greets the visitor (spoken), then listens; the reply is streamed back as audio
 * (single round trip to /api/voice). While waiting for a reply the bars pulse
 * faster. No text is shown.
 */
export function LumiVoiceChat() {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState(false);

  const sessionRef = useRef<string>("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef<string>("");
  const sentRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef<boolean>(false);
  const introDoneRef = useRef<boolean>(false);
  const activeRef = useRef<boolean>(false);
  const langRef = useRef(lang);
  const beginRecognitionRef = useRef<(() => void) | null>(null);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = `voice_${crypto.randomUUID()}`;
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
    };
  }, []);

  // Unlock audio inside the first gesture so streamed replies can play later.
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

  // Play a streaming audio URL on the shared element. `onDone` fires on end/error;
  // `track` toggles the "busy" state (used for the faster visualizer pulse).
  const playUrl = useCallback((url: string, opts?: { track?: boolean; onDone?: () => void }) => {
    const a = audioRef.current;
    if (!a) { opts?.onDone?.(); return; }
    a.pause();
    a.src = url;
    a.load();
    if (opts?.track) setBusy(true);
    const finish = () => { if (opts?.track) setBusy(false); opts?.onDone?.(); };
    a.onplaying = () => { if (opts?.track) setBusy(false); };
    a.onended = finish;
    a.onerror = () => { console.error("Audio play error:", a.error?.message); finish(); };
    a.play().catch((err) => { console.error("Audio play error:", err); finish(); });
  }, []);

  const send = useCallback((text: string) => {
    const message = text.trim();
    if (!message) return;
    const spoken: "en" | "fa" = isFarsi(message) ? "fa" : "en";
    // One round trip: transcript → Lumi → streamed audio reply. When the reply
    // finishes, resume listening so the conversation can continue hands-free
    // (guarded by activeRef, so toggling the mic off ends the loop).
    const url = `/api/voice?lang=${spoken}&session_id=${encodeURIComponent(sessionRef.current)}&transcript=${encodeURIComponent(message)}`;
    playUrl(url, {
      track: true,
      onDone: () => {
        if (activeRef.current) beginRecognitionRef.current?.();
      },
    });
  }, [playUrl]);

  const beginRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !activeRef.current) return;
    try {
      const rec = new Ctor();
      rec.lang = langRef.current === "fa" ? "fa-IR" : "en-US";
      // Non-continuous: recognition ends automatically on a natural pause, and it
      // is that end that fires onend → send. (In continuous mode it never
      // auto-ends, so the transcript was never sent unless the user tapped the mic
      // a second time — which is the "no response after speaking" bug.)
      rec.continuous = false;
      rec.interimResults = false;
      finalRef.current = "";
      sentRef.current = false;
      rec.onresult = (e) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0]?.transcript ?? "";
        }
        finalRef.current = transcript.trim();
      };
      rec.onerror = () => {
        /* transient (no-speech / aborted); onend runs next and handles it */
      };
      rec.onend = () => {
        // A manual mic-off clears activeRef first, so that path neither sends nor
        // resumes — it just stops.
        if (!activeRef.current) return;
        const finalText = finalRef.current.trim();
        if (finalText && !sentRef.current) {
          sentRef.current = true;
          send(finalText);
        }
      };
      rec.start();
      recRef.current = rec;
    } catch {
      /* recognition unavailable */
    }
  }, [send]);

  // Keep a stable handle so send() can resume listening without a dependency cycle.
  useEffect(() => {
    beginRecognitionRef.current = beginRecognition;
  }, [beginRecognition]);

  const startRecording = useCallback(() => {
    activeRef.current = true;
    if (!introDoneRef.current) {
      // First open: Lumi greets, then we start listening (so the greeting isn't
      // captured as input).
      introDoneRef.current = true;
      const introText = t.voice.intro;
      const url = `/api/voice/speech?lang=${langRef.current}&text=${encodeURIComponent(introText)}`;
      playUrl(url, { onDone: () => { if (activeRef.current) beginRecognition(); } });
    } else {
      beginRecognition();
    }
  }, [beginRecognition, playUrl, t.voice.intro]);

  const stopRecording = useCallback(() => {
    // Clear active BEFORE stopping so the pending onend neither sends nor resumes.
    activeRef.current = false;
    try { recRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center" onPointerDown={unlockAudio}>
      {/* Shared audio element — greeting + every reply play here. */}
      <audio ref={audioRef} preload="auto" className="hidden" aria-hidden />
      <AIVoiceInput
        onStart={startRecording}
        onStop={stopRecording}
        visualizerBars={40}
        className={busy ? "[&_.w-64>div]:!animate-pulse [&_.w-64>div]:![animation-duration:0.4s]" : undefined}
      />
    </div>
  );
}
