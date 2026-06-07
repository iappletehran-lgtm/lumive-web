"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-aware perceptual layer (desktop pointers only):
 *  - a soft glow that smoothly follows the cursor
 *  - subtle tilt on any [data-tilt] element (event-delegated, so it works for
 *    dynamically rendered cards and across client navigation)
 * Disabled on touch devices and when reduced-motion is requested.
 */
export function PointerFX() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const noHover = window.matchMedia("(hover: none)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (noHover || reduce) return;

    const g = glow.current;
    let tx = 0, ty = 0, cx = 0, cy = 0, shown = false, raf = 0;
    let tilted: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (g && !shown) { g.classList.add("on"); shown = true; }

      // delegated tilt
      const el = (e.target as HTMLElement)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (el !== tilted && tilted) { tilted.style.transform = ""; }
      tilted = el;
      if (el) {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg) translateY(-4px)`;
      }
    };

    const loop = () => {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      if (g) g.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      if (tilted) tilted.style.transform = "";
    };
  }, []);

  return <div ref={glow} className="cursor-glow" aria-hidden />;
}
