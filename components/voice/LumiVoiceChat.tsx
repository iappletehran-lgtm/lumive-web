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
 * NOTE: this build has verbose "[VOICE]" console logging on every recognition
 * event to diagnose why the transcript sometimes never reaches /api/voice.
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
  const micGrantedRef = useRef<boolean>(false);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!sessionRef.current) sessionRef.current = `voice_${crypto.randomUUID()}`;
    return () => {
      try { recRef.current?.abort(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, []);

  // BUG 3 fix — explicitly request microphone permission (in the user gesture),
  // then release the stream so SpeechRecognition can use the mic. Without a prior
  // grant, recognition.start() can end immediately with a "not-allowed" error and
  // never produce a transcript.
  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (micGrantedRef.current) return true;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      vlog("getUserMedia unavailable");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop()); // only needed the permission grant
      micGrantedRef.current = true;
      vlog("mic permission GRANTED");
      return true;
    } catch (err) {
      vlog("mic permission DENIED:", (err as Error).name, "-", (err as Error).message);
      return false;
    }
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
        if (activeRef.current) beginRecognitionRef.current?.();
      },
    });
  }, [playUrl]);

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

      rec.onstart = () => vlog("started");
      rec.onaudiostart = () => vlog("audio start");
      rec.onspeechstart = () => vlog("speech detected");
      rec.onresult = (e) => {
        // BUG 2 (already ref-based): store transcript in a ref, not state, so onend
        // reads the fresh value rather than a stale closure.
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0]?.transcript ?? "";
        }
        finalRef.current = transcript.trim();
        vlog("result:", JSON.stringify(finalRef.current));
      };
      rec.onspeechend = () => vlog("speech ended");
      rec.onnomatch = () => vlog("no match");
      rec.onerror = (ev) => vlog("ERROR:", ev?.error);
      rec.onend = () => {
        vlog("recognition ended — transcript=" + JSON.stringify(finalRef.current) + " active=" + activeRef.current);
        // A manual mic-off clears activeRef first, so that path neither sends nor
        // resumes — it just stops.
        if (!activeRef.current) return;
        const finalText = finalRef.current.trim();
        if (finalText && !sentRef.current) {
          sentRef.current = true;
          send(finalText);
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
  }, [send]);

  // Keep a stable handle so send() can resume listening without a dependency cycle.
  useEffect(() => {
    beginRecognitionRef.current = beginRecognition;
  }, [beginRecognition]);

  const startRecording = useCallback(() => {
    activeRef.current = true;
    vlog("startRecording (introDone=" + introDoneRef.current + ")");
    // Request mic permission up front, inside the user gesture (BUG 3).
    void ensureMic();

    if (!introDoneRef.current) {
      // First open: Lumi greets, then we start listening (so the greeting isn't
      // captured as input).
      introDoneRef.current = true;
      const introText = t.voice.intro;
      const url = `/api/voice/speech?lang=${langRef.current}&text=${encodeURIComponent(introText)}`;

      // BUG 4 fix — start listening when the intro audio ends, but guard with a
      // fallback timeout in case onended never fires (204/stream/autoplay issues).
      let started = false;
      const begin = (why: string) => {
        if (started || !activeRef.current) return;
        started = true;
        if (introTimerRef.current) { clearTimeout(introTimerRef.current); introTimerRef.current = null; }
        vlog("intro complete (" + why + ") → beginRecognition");
        beginRecognition();
      };

      vlog("playing intro");
      playUrl(url, { onDone: () => begin("audio-onended") });
      introTimerRef.current = setTimeout(() => begin("fallback-timeout-5s"), 5000);
    } else {
      beginRecognition();
    }
  }, [beginRecognition, playUrl, ensureMic, t.voice.intro]);

  const stopRecording = useCallback(() => {
    // Clear active BEFORE stopping so the pending onend neither sends nor resumes.
    activeRef.current = false;
    if (introTimerRef.current) { clearTimeout(introTimerRef.current); introTimerRef.current = null; }
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
