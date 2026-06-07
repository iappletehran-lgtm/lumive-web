/**
 * Global motion token system (7.1).
 * Single source of truth for JS-driven motion. Mirrors the CSS variables in
 * globals.css so every component shares one motion language — no component
 * defines its own timing independently.
 */
export const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"; // cinematic, calm

export const DUR = {
  fast: 160,   // micro-feedback (hover, tap)
  base: 280,   // component transitions
  slow: 560,   // section reveals
} as const;

/** Hierarchy of motion intent — keep usage consistent across the app. */
export const MOTION = {
  micro: { duration: DUR.fast, ease: EASE },
  section: { duration: DUR.slow, ease: EASE },
  page: { duration: DUR.slow, ease: EASE },
} as const;
