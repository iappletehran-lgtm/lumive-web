"use client";

import { useEffect } from "react";

/**
 * Unified micro-feedback layer — the visual + spatial half of the interaction
 * triad, synchronized with sound.
 *
 * The tap glow fires on `click`, the SAME event SoundController uses to play
 * the tone, so glow and sound start on the exact same instant — "sound timing
 * matches animation". The press-scale motion fires earlier on :active
 * (pointer-down), which is correct: a press should feel instant under the
 * finger, while the confirming glow + tone land together on activation.
 *
 * The glow is tinted with the current section's ambient colour (--atmo-r/g/b,
 * set by PerceptualLayer), so interaction feedback reinforces the same focus as
 * the section lighting. Keyboard activations (Enter/Space, which report no
 * pointer coordinates) place the glow on the focused element's centre, so the
 * feedback is reachable without a mouse.
 *
 * Single delegated listener, nodes self-remove on animation end, disabled under
 * reduced-motion — zero idle cost.
 */
export function InteractionField() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // honour reduced-motion: no spawned motion

    const isInteractive = (el: HTMLElement | null) =>
      el?.closest?.('a[href], button, [data-sound], [role="button"]') as HTMLElement | null;

    const onClick = (e: MouseEvent) => {
      const target = isInteractive(e.target as HTMLElement);
      if (!target) return;

      let x = e.clientX;
      let y = e.clientY;

      // Keyboard activation reports (0, 0) — centre the glow on the element.
      if (!x && !y) {
        const r = target.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }

      const tap = document.createElement("span");
      tap.className = "tap-glow";
      tap.style.left = `${x}px`;
      tap.style.top = `${y}px`;
      document.body.appendChild(tap);
      tap.addEventListener("animationend", () => tap.remove(), { once: true });
    };

    window.addEventListener("click", onClick, { passive: true });
    return () => window.removeEventListener("click", onClick);
  }, []);

  return null;
}
