/**
 * Synchronization layer — the single clock that drives every scroll-derived
 * effect on the site, so motion, lighting, depth, and progress can never drift
 * apart. Replaces what used to be four separate scroll listeners and several
 * independent rAF loops with ONE passive scroll listener and ONE animation
 * frame loop that all consumers read from.
 *
 * Each frame it publishes a shared SyncFrame and writes canonical CSS vars:
 *   --scroll-progress  (0..1)   document scroll progress  → progress bar
 *   --sync-intensity   (0.38..1) velocity-damped calm     → lighting/breathing
 *   --ambient-intensity         mirror of --sync-intensity (back-compat)
 *
 * Consumers either subscribe (imperative, e.g. PerceptualLayer's orbs) or read
 * the CSS var directly (declarative, e.g. the progress bar). Either way they
 * share one timeline, which is what makes the page feel like a single system.
 *
 * Idempotent: startSync() can be called by any consumer; it only ever starts
 * one loop.
 */

export type SyncFrame = {
  scrollY: number;
  progress: number; // 0..1
  velocity: number; // px/ms, absolute, decaying
  direction: 1 | -1; // 1 = down, -1 = up
  intensity: number; // 0.38..1 — lower while scrolling fast (calm > frantic)
  dt: number; // ms since previous frame
  t: number; // high-res timestamp
};

type Sub = (frame: SyncFrame) => void;

const subs = new Set<Sub>();
let started = false;

const frame: SyncFrame = {
  scrollY: 0,
  progress: 0,
  velocity: 0,
  direction: 1,
  intensity: 1,
  dt: 16,
  t: 0,
};

let rawY = 0;
let lastY = 0;
let lastT = 0;

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  const root = document.documentElement;
  rawY = lastY = window.scrollY;
  lastT = performance.now();

  // One passive scroll listener feeds raw position + instantaneous velocity.
  const onScroll = () => {
    const now = performance.now();
    const dy = window.scrollY - lastY;
    const dt = Math.max(8, now - lastT);
    frame.velocity = Math.abs(dy) / dt;
    if (dy !== 0) frame.direction = dy > 0 ? 1 : -1;
    rawY = window.scrollY;
    lastY = window.scrollY;
    lastT = now;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // One animation frame loop derives everything else and publishes.
  let prevT = performance.now();
  const loop = (t: number) => {
    frame.dt = Math.max(1, t - prevT);
    frame.t = t;
    prevT = t;

    const max = root.scrollHeight - root.clientHeight;
    frame.scrollY = rawY;
    frame.progress = max > 0 ? Math.min(1, Math.max(0, rawY / max)) : 0;

    // Velocity eases back to 0 when scrolling stops (so reveals that fire just
    // after a flick read it honestly, and lighting recovers smoothly).
    frame.velocity *= 0.9;
    if (frame.velocity < 0.0005) frame.velocity = 0;

    // Calm factor: dimmer when moving fast, eased back toward 1 when still.
    const targetIntensity = Math.max(0.38, 1 - frame.velocity * 0.3);
    frame.intensity += (targetIntensity - frame.intensity) * 0.08;

    // Canonical CSS vars — single writer, so declarative consumers stay in sync.
    root.style.setProperty("--scroll-progress", frame.progress.toFixed(4));
    root.style.setProperty("--sync-intensity", frame.intensity.toFixed(3));
    root.style.setProperty("--ambient-intensity", frame.intensity.toFixed(3));

    subs.forEach((cb) => cb(frame));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

export function subscribeSync(cb: Sub) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

export function getFrame(): SyncFrame {
  return frame;
}

export function getVelocity() {
  return frame.velocity;
}

export function getDirection() {
  return frame.direction;
}
