"use client";

import { useEffect, useRef } from "react";
import { startSync, subscribeSync } from "@/lib/sync";

/**
 * Perceptual UI layer — creates "felt intelligence" through environmental cues.
 *
 * Three systems work together:
 *  1. Focal orb   — a large, soft radial gradient that smoothly re-aims its
 *                   centre as you scroll between sections, mimicking a light
 *                   source that knows where the important content is.
 *  2. Depth field — a fixed viewport vignette that darkens the peripheral
 *                   edges slightly, creating foreground/background separation.
 *  3. Scroll breath — the orb intensity eases down during fast scroll and
 *                   recovers gently when you stop, so motion feels like
 *                   transit and stillness feels like presence.
 *
 * A section-entry pulse (CSS class, handled here) adds a brief inner-glow
 * bloom the moment each section becomes the active reading zone.
 *
 * All effects respect prefers-reduced-motion and use compositor-friendly
 * properties (transform + opacity) in the rAF loop.
 */

type SectionAtmo = {
  /** Brand colour for this section's light */
  color: string;
  /** Focal X: % of viewport width where the "light source" aims */
  fx: number;
  /** Focal Y: % of viewport height where the "light source" aims */
  fy: number;
  /** Relative brightness 0–1 (dark sections lower so orb stays subtle) */
  qi: number;
};

// Each section's atmospheric signature.
// fx/fy describe the approximate location of the primary content focal point
// so the orb feels like it's illuminating what you're actually reading.
const ATMO: Record<string, SectionAtmo> = {
  // Home page
  top:       { color: "#1B3F72", fx: 68, fy: 38, qi: 1.00 }, // hero: upper-right (dashboard visual)
  trust:     { color: "#1A8C6B", fx: 50, fy: 38, qi: 0.82 }, // trust band: centred
  story:     { color: "#3DBFA3", fx: 28, fy: 55, qi: 0.42 }, // storytelling: dark bg, left rail
  services:  { color: "#1A8C6B", fx: 24, fy: 36, qi: 0.88 }, // services: upper-left heading
  process:   { color: "#5B7FA6", fx: 50, fy: 42, qi: 0.80 }, // process: centred timeline
  framework: { color: "#3DBFA3", fx: 66, fy: 50, qi: 0.42 }, // framework: dark bg, right lean
  why:       { color: "#5B7FA6", fx: 50, fy: 36, qi: 0.85 }, // why: centred heading
  founder:   { color: "#1B3F72", fx: 34, fy: 44, qi: 0.90 }, // founder: left portrait
  readiness: { color: "#1A8C6B", fx: 66, fy: 46, qi: 0.85 }, // readiness: right quiz card
  contact:   { color: "#3DBFA3", fx: 70, fy: 38, qi: 1.00 }, // contact: right form card
  book:      { color: "#1A8C6B", fx: 50, fy: 48, qi: 0.46 }, // finalcta: dark bg, centred
  // Lab page
  access:    { color: "#3DBFA3", fx: 50, fy: 42, qi: 0.44 }, // lab cta: dark bg
};

const DEFAULT_ATMO: SectionAtmo = { color: "#1B3F72", fx: 55, fy: 42, qi: 0.80 };

// Parse hex colour to separate r/g/b for use in rgba() gradients
function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Orb dimensions — primary is larger, secondary softer counterpoint
const P_W = 840, P_H = 720;   // primary orb px
const S_W = 580, S_H = 500;   // secondary orb px

export function PerceptualLayer() {
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const orb1 = p1.current;
    const orb2 = p2.current;
    if (!orb1 || !orb2) return;

    // ── Interpolated state ───────────────────────────────────
    let cx = DEFAULT_ATMO.fx;
    let cy = DEFAULT_ATMO.fy;
    let ci = 0;               // current intensity (lerps toward target)

    let tx = DEFAULT_ATMO.fx; // target position X
    let ty = DEFAULT_ATMO.fy; // target position Y
    let ti = DEFAULT_ATMO.qi; // target intensity

    // ── Colour state (only updates on section change) ────────
    let [cr, cg, cb] = hexToRGB(DEFAULT_ATMO.color);

    const applyColour = (hex: string) => {
      const [r, g, b] = hexToRGB(hex);
      cr = r; cg = g; cb = b;
      root.style.setProperty("--atmo-r", String(r));
      root.style.setProperty("--atmo-g", String(g));
      root.style.setProperty("--atmo-b", String(b));
      root.style.setProperty("--ambient", hex);
      // Update gradient without triggering rAF (colour changes are infrequent)
      orb1.style.background =
        `radial-gradient(circle at 50% 50%, rgba(${r},${g},${b},0.13) 0%, transparent 65%)`;
      orb2.style.background =
        `radial-gradient(circle at 50% 50%, rgba(${r},${g},${b},0.08) 0%, transparent 60%)`;
    };

    // Scroll-velocity breathing now comes from the shared sync clock
    // (frame.intensity), so lighting calm, reveal snapping, and the progress
    // bar all respond to the same velocity signal.
    startSync();

    // ── Section awareness ────────────────────────────────────
    // Uses a narrow root margin so only the section occupying the
    // centre of the viewport is considered "active".
    const activeSet = new Set<string>();

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).id;
          const atmo = ATMO[id];
          if (!atmo) return;

          if (e.isIntersecting) {
            activeSet.add(id);
            tx = atmo.fx;
            ty = atmo.fy;
            ti = atmo.qi;
            applyColour(atmo.color);

            // Section entry pulse — brief inner-glow bloom
            const el = e.target as HTMLElement;
            if (!el.classList.contains("section-lit")) {
              el.classList.add("section-lit");
              setTimeout(() => el.classList.remove("section-lit"), 1800);
            }
          } else {
            activeSet.delete(id);
          }
        });
      },
      { rootMargin: "-36% 0px -36% 0px", threshold: 0 }
    );

    document.querySelectorAll("section[id]").forEach((s) => obs.observe(s));

    // ── Orb interpolation — runs inside the single sync frame ───
    // Lerp constant 0.038 ≈ 60fps ≈ ~26 frame half-life ≈ very cinematic
    const K = 0.038;

    applyColour(DEFAULT_ATMO.color); // initialise gradient before first frame

    if (reduce) {
      // Static, no animation — just apply initial colour
      orb1.style.opacity = "0.6";
      orb2.style.opacity = "0.3";
      return () => obs.disconnect();
    }

    // One subscription to the shared clock — no private rAF loop. The orbs
    // breathe on frame.intensity, the same signal the progress bar and reveals
    // use, so the whole environment moves as one.
    const unsubscribe = subscribeSync((f) => {
      cx += (tx - cx) * K;
      cy += (ty - cy) * K;
      const finalI = ti * f.intensity;
      ci += (finalI - ci) * K;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Primary: centre of orb at (cx%, cy%) of viewport
      const px = (cx / 100) * vw - P_W / 2;
      const py = (cy / 100) * vh - P_H / 2;
      orb1.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      orb1.style.opacity = ci.toFixed(3);

      // Secondary: soft counterpoint — mirrors X toward opposite side,
      // sits lower. Creates balanced atmospheric depth.
      const sx = (100 - cx) * 0.52 + 18;
      const sy = Math.min(cy + 22, 84);
      const spx = (sx / 100) * vw - S_W / 2;
      const spy = (sy / 100) * vh - S_H / 2;
      orb2.style.transform = `translate(${spx.toFixed(1)}px, ${spy.toFixed(1)}px)`;
      orb2.style.opacity = (ci * 0.52).toFixed(3);
    });

    return () => {
      obs.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <div aria-hidden role="presentation" className="pointer-events-none select-none">
      {/* Depth field — edge vignette creates foreground/background perception */}
      <div className="depth-vignette" />

      {/* Primary focal orb — tracks the active section's attention point */}
      <div ref={p1} className="atmo-orb atmo-primary" />

      {/* Secondary counterpoint orb — balanced, softer */}
      <div ref={p2} className="atmo-orb atmo-secondary" />
    </div>
  );
}
