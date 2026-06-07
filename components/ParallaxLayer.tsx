"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startSync, subscribeSync } from "@/lib/sync";

/**
 * Scroll-parallax wrapper for background depth layers. Translates its contents
 * vertically as a fraction of scroll, so background lights drift slower than
 * foreground content — the classic cinematic depth cue.
 *
 * Driven by the shared sync clock (one rAF, no private scroll listener). The
 * offset is measured from the element's centre relative to the viewport centre,
 * so it works in any section, not just the hero. Keep `speed` small (0.03–0.12)
 * — this is a whisper of motion, never a slideshow effect.
 *
 *   <ParallaxLayer speed={0.06} className="absolute -right-32 -top-24">
 *     <div className="orb animate-float h-[420px] w-[420px] bg-lumive-light/15" />
 *   </ParallaxLayer>
 *
 * The positioning lives on the wrapper; animated children (e.g. animate-float)
 * keep their own transform, so parallax and float never fight. Disabled under
 * reduced-motion.
 */
export function ParallaxLayer({
  speed = 0.06,
  className = "",
  children,
}: {
  speed?: number;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const el = ref.current;
    if (!el) return;

    startSync();

    let centerDoc = 0;
    let vh = window.innerHeight;
    const measure = () => {
      const r = el.getBoundingClientRect();
      centerDoc = r.top + window.scrollY + el.offsetHeight / 2;
      vh = window.innerHeight;
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    const unsubscribe = subscribeSync((f) => {
      // 0 when the layer is centred in the viewport; drifts as it moves away.
      const delta = (f.scrollY + vh / 2 - centerDoc) * speed;
      el.style.transform = `translate3d(0, ${delta.toFixed(1)}px, 0)`;
    });

    return () => {
      window.removeEventListener("resize", measure);
      unsubscribe();
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }} aria-hidden>
      {children}
    </div>
  );
}
