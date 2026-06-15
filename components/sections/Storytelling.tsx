"use client";

import { useEffect, useRef, useState } from "react";
import { ParallaxLayer } from "../ParallaxLayer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Scene tones drive the line-art motif; all copy comes from translations.
const TONES = ["challenge", "opportunity", "roadmap", "automation", "transformation", "growth"] as const;

export function Storytelling() {
  const [active, setActive] = useState(0);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Rail reveal: staggered slide-in + a brief teal flash per item the first time
  // the rail scrolls into view.
  const [revealed, setRevealed] = useState(false);
  const [flashing, setFlashing] = useState<Set<number>>(new Set());
  const railRef = useRef<HTMLUListElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const { t } = useLanguage();
  const RAIL = t.journey.rail;
  const SCENES = t.journey.scenes;

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("story-in")),
      { threshold: 0.25 }
    );
    const activeObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sceneRefs.current.forEach((el) => {
      if (el) {
        reveal.observe(el);
        activeObs.observe(el);
      }
    });
    return () => {
      reveal.disconnect();
      activeObs.disconnect();
    };
  }, []);

  // Sequential reveal of the journey rail (IntersectionObserver trigger, CSS
  // transitions). Reduced motion → show everything at once, no flashes.
  useEffect(() => {
    const ul = railRef.current;
    if (!ul) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setRevealed(true);
        TONES.forEach((_, i) => {
          timers.push(
            setTimeout(() => {
              setFlashing((prev) => new Set(prev).add(i)); // highlight teal
              timers.push(
                setTimeout(
                  () => setFlashing((prev) => {
                    const next = new Set(prev);
                    next.delete(i); // then dim back
                    return next;
                  }),
                  450
                )
              );
            }, i * 150)
          );
        });
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(ul);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  // Continuous loop: while the section is in view, sweep the teal highlight down
  // the rail (01→06, ~600ms each, 150ms gap), wait 5s, repeat. IntersectionObserver
  // starts it on enter, stops on leave, restarts on re-entry. Reduced motion: off.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const HOLD = 600; // teal duration per item
    const GAP = 150; // dark gap between items
    const STEP = HOLD + GAP; // one-at-a-time slot
    const SWEEP = TONES.length * STEP; // full sweep duration
    const PAUSE = 5000; // wait between sweeps

    let timers: ReturnType<typeof setTimeout>[] = [];
    let running = false;

    const clearTimers = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const sweep = () => {
      TONES.forEach((_, i) => {
        timers.push(setTimeout(() => setFlashing((p) => new Set(p).add(i)), i * STEP));
        timers.push(
          setTimeout(() => setFlashing((p) => {
            const n = new Set(p);
            n.delete(i);
            return n;
          }), i * STEP + HOLD)
        );
      });
    };

    const cycle = () => {
      if (!running) return;
      sweep();
      timers.push(setTimeout(cycle, SWEEP + PAUSE));
    };

    const start = () => {
      if (running) return;
      running = true;
      // First sweep after a pause so it never collides with the one-time reveal flash.
      timers.push(setTimeout(cycle, PAUSE));
    };
    const stop = () => {
      running = false;
      clearTimers();
      setFlashing(new Set()); // drop loop highlights (the scroll-active item stays teal)
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(section);

    return () => {
      io.disconnect();
      clearTimers();
    };
  }, []);

  return (
    <section ref={sectionRef} id="story" className="emerge-midnight relative overflow-hidden text-mist">
      <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <ParallaxLayer speed={0.07} className="pointer-events-none absolute right-0 top-1/4">
        <div className="orb animate-float h-[460px] w-[460px] bg-teal/10" />
      </ParallaxLayer>
      <ParallaxLayer speed={0.11} className="pointer-events-none absolute -left-20 bottom-1/4">
        <div className="orb animate-float-slow h-[380px] w-[380px] bg-slate-indigo/15" />
      </ParallaxLayer>

      <div className="relative mx-auto grid max-w-container gap-10 px-5 py-24 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8 lg:py-28">
        {/* sticky progress rail */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-lumive-light">
              {t.journey.eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-mist">
              {t.journey.title}
            </h2>
            <ul ref={railRef} className="mt-9 space-y-1">
              {RAIL.map((label, i) => {
                // Teal when it's the scroll-active item OR mid reveal-flash.
                const on = i === active || flashing.has(i);
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-[400ms] ease-out motion-reduce:!translate-x-0 motion-reduce:!opacity-100 motion-reduce:!transition-none ${
                      revealed ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"
                    }`}
                    style={{ transitionDelay: revealed ? `${i * 150}ms` : "0ms" }}
                  >
                    <span className={`h-px transition-all duration-360 ease-io ${on ? "w-8 bg-lumive-light" : "w-4 bg-white/20"}`} />
                    <span className={`font-mono text-[11px] uppercase tracking-wide transition-colors duration-360 ease-io ${on ? "text-lumive-light" : "text-cloud/45"}`}>
                      {String(i + 1).padStart(2, "0")} · {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* scenes */}
        <div>
          {SCENES.map((s, i) => (
            <div
              key={i}
              data-i={i}
              ref={(el) => { sceneRefs.current[i] = el; }}
              className="story-scene flex min-h-[72vh] flex-col justify-center border-b border-white/5 py-12 first:pt-0 last:border-0 lg:min-h-[78vh]"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-5xl font-bold text-white/10 lg:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <SceneMotif tone={TONES[i]} />
              </div>
              <span className="mt-8 font-mono text-xs font-medium uppercase tracking-wider text-lumive-light lg:hidden">
                {s.eyebrow}
              </span>
              <h3 className="mt-3 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-mist">
                {s.title}
              </h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-cloud/75">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Minimal, evolving line-art motif per scene — abstract, no AI cliché. */
function SceneMotif({ tone }: { tone: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const cls = "h-12 w-28 text-lumive-light";
  switch (tone) {
    case "challenge":
      return <svg className={cls} viewBox="0 0 112 48" {...p}><circle cx="14" cy="14" r="3" /><circle cx="50" cy="34" r="3" /><circle cx="84" cy="12" r="3" /><circle cx="32" cy="40" r="3" /><circle cx="98" cy="36" r="3" opacity=".5" /></svg>;
    case "opportunity":
      return <svg className={cls} viewBox="0 0 112 48" {...p}><circle cx="14" cy="24" r="3" /><circle cx="56" cy="14" r="3" /><circle cx="56" cy="34" r="3" /><circle cx="98" cy="24" r="3" /><path d="M17 23 53 15M17 25 53 33M59 14l36 9M59 34l36-9" opacity=".6" /></svg>;
    case "roadmap":
      return <svg className={cls} viewBox="0 0 112 48" {...p}><path d="M8 38 C 36 38 30 12 56 12 S 78 38 104 38" opacity=".7" /><circle cx="8" cy="38" r="3" /><circle cx="56" cy="12" r="3" /><circle cx="104" cy="38" r="3" /></svg>;
    case "automation":
      return <svg className={cls} viewBox="0 0 112 48" {...p}><path d="M16 24h60" /><path d="M70 18l8 6-8 6" /><path d="M96 24a8 8 0 11-8-8" opacity=".6" /></svg>;
    case "transformation":
      return <svg className={cls} viewBox="0 0 112 48" {...p}><rect x="60" y="8" width="14" height="14" rx="2" /><rect x="80" y="8" width="14" height="14" rx="2" /><rect x="60" y="26" width="14" height="14" rx="2" /><rect x="80" y="26" width="14" height="14" rx="2" opacity=".6" /><path d="M14 24h40" /><path d="M48 18l8 6-8 6" /></svg>;
    default: // growth
      return <svg className={cls} viewBox="0 0 112 48" {...p}><path d="M14 40h84" opacity=".4" /><rect x="20" y="30" width="10" height="10" rx="1.5" /><rect x="42" y="22" width="10" height="18" rx="1.5" /><rect x="64" y="14" width="10" height="26" rx="1.5" /><rect x="86" y="6" width="10" height="34" rx="1.5" /></svg>;
  }
}
