/**
 * Lumive UI sound system — minimal, synthesized, premium.
 * - No audio files: short, soft Web Audio tones (zero asset weight).
 * - Off by default (accessibility-safe; no surprise audio).
 * - Single AudioContext, debounced so sounds never stack/overlap.
 * - Persisted to localStorage. Pure module store (works with server components
 *   via the data-sound delegation in SoundController).
 */
export type SoundName = "click" | "cta" | "nav" | "toggle" | "assistant" | "lab";

const KEY = "lumive.sound";
let enabled = false;
let ctx: AudioContext | null = null;
let lastPlay = 0;
const subs = new Set<() => void>();

function notify() { subs.forEach((cb) => cb()); }

export function initSound() {
  if (typeof window === "undefined") return;
  try { enabled = localStorage.getItem(KEY) === "on"; } catch { /* ignore */ }
  notify();
}

export function isEnabled() { return enabled; }

export function setEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem(KEY, v ? "on" : "off"); } catch { /* ignore */ }
  if (v) ensureCtx()?.resume?.();
  notify();
}

export function subscribe(cb: () => void) {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** A single soft tone with a quick, gentle envelope. */
function tone(c: AudioContext, freq: number, dur: number, peak: number, type: OscillatorType = "sine", at = 0) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function play(name: SoundName) {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastPlay < 60) return; // debounce — never stack
  lastPlay = now;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  try {
    switch (name) {
      case "cta":
        tone(c, 523.25, 0.09, 0.05, "sine");
        tone(c, 698.46, 0.10, 0.045, "sine", 0.05);
        break;
      case "nav":
        tone(c, 440, 0.06, 0.035, "triangle");
        break;
      case "toggle":
        tone(c, 600, 0.05, 0.04, "sine");
        break;
      case "assistant":
        tone(c, 493.88, 0.08, 0.045, "sine");
        tone(c, 739.99, 0.10, 0.04, "sine", 0.06);
        break;
      case "lab":
        tone(c, 392, 0.07, 0.04, "sine");
        tone(c, 523.25, 0.07, 0.038, "sine", 0.05);
        tone(c, 659.25, 0.09, 0.035, "sine", 0.10);
        break;
      default: // click
        tone(c, 660, 0.05, 0.04, "sine");
    }
  } catch { /* ignore */ }
}
