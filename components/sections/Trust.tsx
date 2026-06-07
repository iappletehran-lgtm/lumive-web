"use client";

import { useEffect, useRef, useState } from "react";

interface Metric {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

// Honest, pre-launch-appropriate indicators — no invented client numbers.
const METRICS: Metric[] = [
  { value: 90, label: "Days to a live system" },
  { value: 6, label: "AI services we build" },
  { value: 6, label: "Industries we focus on" },
  { value: 100, suffix: "%", label: "Handed to your team" },
];

function useCountUp(target: number, run: boolean, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);
  return n;
}

function Stat({ m, run, delay }: { m: Metric; run: boolean; delay: number }) {
  const n = useCountUp(m.value, run);
  return (
    <div
      data-tilt
      className="reveal glass-tint rounded-xl px-6 py-7 text-center shadow-sm transition-all duration-360 ease-io hover:shadow-md"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="font-mono text-4xl font-bold text-sapphire lg:text-5xl">
        {m.prefix}{n}{m.suffix}
      </div>
      <div className="mt-2 text-sm leading-snug text-steel">{m.label}</div>
    </div>
  );
}

export function Trust() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setRun(true);
          el.querySelectorAll(".reveal").forEach((r) => r.classList.add("is-visible"));
          obs.disconnect();
        }
      }),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="trust" className="relative overflow-hidden border-y border-cloud/50 bg-white">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div ref={ref} className="relative mx-auto max-w-container px-5 py-16 lg:px-8">
        <p className="mb-9 text-center font-mono text-xs font-medium uppercase tracking-wider text-teal">
          Built for growing businesses across professional services, logistics, e-commerce, and SaaS
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {METRICS.map((m, i) => (
            <Stat key={m.label} m={m} run={run} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}
