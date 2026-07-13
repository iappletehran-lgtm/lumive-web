"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Debug logging — prefixed so it's easy to filter the console by "[VOICE]".
const vlog = (...args: unknown[]) => {
  console.log("[VOICE]", ...args);
};

// Minimal Web Speech API typings (not in the standard DOM lib).
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onnomatch?: (() => void) | null;
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
 *
 * Mic handling: SpeechRecognition acquires the microphone itself and prompts for
 * permission on first start(). We must NOT call getUserMedia ourselves first —
 * acquiring then releasing a stream leaves recognition with a dead mic in Chrome
 * (mic opens but hears nothing → endless "no-speech").
 *
 * NOTE: this build keeps verbose "[VOICE]" console logging on every event.
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
  const noSpeechRef = useRef<boolean>(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = `voice_${crypto.randomUUID()}`;
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
    };
  }, []);

  // Schedule beginRecognition after `delay` ms (single pending timer at a time),
  // used both after the intro finishes and to recover from a no-speech timeout.
  const scheduleRecognition = useCallback((delay: number, why: string) => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null;
      if (!activeRef.current) return;
      vlog("beginRecognition (" + why + ")");
      beginRecognitionRef.current?.();
    }, delay);
  }, []);

  // Unlock audio inside the first gesture so streamed replies can play later.
  const unlockAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a || unlockedRef.current) return;
    try {
      a.src = SILENT_WAV;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => { a.pause(); unlockedRef.current = true; vlog("audio unlocked"); })
          .catch(() => { /* retry next gesture */ });
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
    let done = false;
    const finish = (why: string) => {
      if (done) return;
      done = true;
      if (opts?.track) setBusy(false);
      vlog("audio finished (" + why + ")");
      opts?.onDone?.();
    };
    a.onplaying = () => { if (opts?.track) setBusy(false); vlog("audio playing"); };
    a.onended = () => finish("ended");
    a.onerror = () => { console.error("Audio play error:", a.error?.message); finish("error"); };
    a.play().catch((err) => { console.error("Audio play error:", err); finish("play-rejected"); });
  }, []);

  const send = useCallback((text: string) => {
    const message = text.trim();
    if (!message) { vlog("send skipped — empty transcript"); return; }
    const spoken: "en" | "fa" = isFarsi(message) ? "fa" : "en";
    // One round trip: transcript → Lumi → streamed audio reply. When the reply
    // finishes, resume listening so the conversation can continue hands-free
    // (guarded by activeRef, so toggling the mic off ends the loop).
    const url = `/api/voice?lang=${spoken}&session_id=${encodeURIComponent(sessionRef.current)}&transcript=${encodeURIComponent(message)}`;
    vlog("calling /api/voice", spoken, JSON.stringify(message));
    playUrl(url, {
      track: true,
      onDone: () => {
        if (activeRef.current) scheduleRecognition(300, "after-reply");
      },
    });
  }, [playUrl, scheduleRecognition]);

  const beginRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { vlog("SpeechRecognition NOT supported in this browser"); return; }
    if (!activeRef.current) { vlog("beginRecognition skipped — not active"); return; }
    try {
      const rec = new Ctor();
      rec.lang = langRef.current === "fa" ? "fa-IR" : "en-US";
      // Non-continuous: recognition ends automatically on a natural pause, and it
      // is that end that fires onend → send.
      rec.continuous = false;
      rec.interimResults = false;
      finalRef.current = "";
      sentRef.current = false;
      noSpeechRef.current = false;

      rec.onstart = () => vlog("started");
      rec.onaudiostart = () => vlog("audio start");
      rec.onspeechstart = () => vlog("speech detected");
      rec.onresult = (e) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0]?.transcript ?? "";
        }
        finalRef.current = transcript.trim();
        vlog("result:", JSON.stringify(finalRef.current));
      };
      rec.onspeechend = () => vlog("speech ended");
      rec.onnomatch = () => vlog("no match");
      rec.onerror = (ev) => {
        vlog("ERROR:", ev?.error);
        // No-speech is a silence timeout, not a fatal error — flag it so onend can
        // restart and keep listening while the mic is on.
        if (ev?.error === "no-speech") noSpeechRef.current = true;
      };
      rec.onend = () => {
        vlog("recognition ended — transcript=" + JSON.stringify(finalRef.current) + " active=" + activeRef.current);
        if (!activeRef.current) return; // manual mic-off
        const finalText = finalRef.current.trim();
        if (finalText && !sentRef.current) {
          sentRef.current = true;
          send(finalText);
          return;
        }
        // No transcript. If it was a silence timeout, restart and keep listening.
        if (noSpeechRef.current) {
          noSpeechRef.current = false;
          scheduleRecognition(500, "no-speech-retry");
        } else {
          vlog("nothing to send (empty transcript)");
        }
      };

      rec.start();
      recRef.current = rec;
      vlog("recognition.start() called (lang=" + rec.lang + ")");
    } catch (err) {
      vlog("beginRecognition threw:", (err as Error).message);
    }
  }, [send, scheduleRecognition]);

  // Keep a stable handle so send()/scheduleRecognition resume listening without a
  // dependency cycle.
  useEffect(() => {
    beginRecognitionRef.current = beginRecognition;
  }, [beginRecognition]);

  const startRecording = useCallback(() => {
    activeRef.current = true;
    vlog("startRecording (introDone=" + introDoneRef.current + ")");

    if (!introDoneRef.current) {
      // First open: Lumi greets, then we listen. Recognition starts ONLY after the
      // intro audio's onended (no fallback timer — that raced ahead and opened the
      // mic while the intro was still playing), plus a 300ms gap so the audio fully
      // releases before the mic opens.
      introDoneRef.current = true;
      const introText = t.voice.intro;
      const url = `/api/voice/speech?lang=${langRef.current}&text=${encodeURIComponent(introText)}`;
      vlog("playing intro");
      playUrl(url, {
        onDone: () => {
          if (activeRef.current) scheduleRecognition(300, "after-intro");
        },
      });
    } else {
      beginRecognition();
    }
  }, [beginRecognition, playUrl, scheduleRecognition, t.voice.intro]);

  const stopRecording = useCallback(() => {
    // Clear active BEFORE stopping so the pending onend neither sends nor resumes.
    activeRef.current = false;
    if (startTimerRef.current) { clearTimeout(startTimerRef.current); startTimerRef.current = null; }
    vlog("stopRecording");
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
