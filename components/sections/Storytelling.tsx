"use client";

import { useEffect, useRef, useState } from "react";
import { ParallaxLayer } from "../ParallaxLayer";

const SCENES = [
  { eyebrow: "Scene 01", title: "The work that holds you back.", body: "Manual processes, scattered data, and no time to figure out where AI fits. The cost is quiet, but it compounds every week.", tone: "challenge" },
  { eyebrow: "Scene 02", title: "Where AI is actually worth it.", body: "Not everywhere. We find the few high-value, low-risk points in how you already work — and we are honest about the rest.", tone: "opportunity" },
  { eyebrow: "Scene 03", title: "A clear, honest plan.", body: "A prioritised roadmap built around your business — not forty-seven recommendations you will never action.", tone: "roadmap" },
  { eyebrow: "Scene 04", title: "The repetitive work, handled.", body: "Automated workflows take over the rule-based tasks that move between your tools, quietly and reliably.", tone: "automation" },
  { eyebrow: "Scene 05", title: "Your operation, running smarter.", body: "Working systems live inside your business — faster responses, fewer errors, better decisions, no new headcount.", tone: "transformation" },
  { eyebrow: "Scene 06", title: "Built to scale as you grow.", body: "Infrastructure, not experiments. Designed to expand with the business and to be run by your own team.", tone: "growth" },
];

const RAIL = ["Challenges", "Opportunities", "Roadmap", "Automation", "Transformation", "Growth & scale"];

export function Storytelling() {
  const [active, setActive] = useState(0);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  return (
    <section id="story" className="emerge-midnight relative overflow-hidden text-mist">
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
              The journey
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-mist">
              From friction to a business that runs smarter.
            </h2>
            <ul className="mt-9 space-y-1">
              {RAIL.map((label, i) => {
                const on = i === active;
                return (
                  <li key={label} className="flex items-center gap-3">
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
              key={s.title}
              data-i={i}
              ref={(el) => { sceneRefs.current[i] = el; }}
              className="story-scene flex min-h-[72vh] flex-col justify-center border-b border-white/5 py-12 first:pt-0 last:border-0 lg:min-h-[78vh]"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-5xl font-bold text-white/10 lg:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <SceneMotif tone={s.tone} />
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
