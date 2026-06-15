"use client";

import { Reveal } from "../Reveal";
import { PrismMark } from "../Logo";
import { Parallax } from "../Parallax";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";
import { ParallaxLayer } from "../ParallaxLayer";
import { palette } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();
  return (
    <section id="top" className="relative overflow-hidden bg-mist pt-[72px]">
      {/* ambient depth layers */}
      <div className="mesh pointer-events-none absolute inset-0 animate-drift" aria-hidden />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <ParallaxLayer speed={0.05} className="pointer-events-none absolute -right-32 -top-24">
        <div className="orb animate-float h-[420px] w-[420px] bg-lumive-light/15" />
      </ParallaxLayer>
      <ParallaxLayer speed={0.09} className="pointer-events-none absolute -left-24 top-40">
        <div className="orb animate-float-slow h-[320px] w-[320px] bg-slate-indigo/15" />
      </ParallaxLayer>

      <div className="relative mx-auto grid max-w-container items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-28">
        {/* copy */}
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-sapphire/15 bg-white/70 px-3.5 py-1.5 font-mono text-[12px] font-medium uppercase tracking-wide text-sapphire">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              {t.hero.badge}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-[clamp(2.6rem,5.2vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-sapphire">
              {t.hero.title1}
              <br className="hidden sm:block" /> {t.hero.title2}{" "}
              <span className="gradient-text">{t.hero.title3}</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-text text-lg leading-relaxed text-steel">
              {t.hero.body}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9">
              <CTAButton variant="secondary" href="#framework" withArrow>
                {t.hero.secondaryCta}
              </CTAButton>
            </div>
            <Reassurance className="mt-4" items={[...t.hero.reassure]} />
            <p className="mt-4 text-sm text-steel">
              {t.hero.alreadyClient}{" "}
              <a href="/login" data-sound="nav" className="focus-brand rounded font-medium text-sapphire underline-offset-2 hover:text-teal hover:underline">
                {t.common.login}
              </a>
            </p>
          </Reveal>

          {/* stat strip */}
          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-cloud pt-7">
              {t.hero.stats.map((s) => (
                <div key={s.l}>
                  <dt className="font-mono text-3xl font-bold text-sapphire">{s.n}</dt>
                  <dd className="mt-1 text-sm leading-snug text-steel">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* visual */}
        <Reveal delay={200} className="relative">
          <Parallax>
            <HeroVisual />
          </Parallax>
        </Reveal>
      </div>
    </section>
  );
}

/* Small qualitative capability icons for the panel (no data, no claims). */
const ICON = {
  flow: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="12" r="2" />
      <path d="M7 6h6a2 2 0 012 2v2M7 18h6a2 2 0 002-2v0" />
    </svg>
  ),
  decide: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" />
      <path d="M7 12c5 0 5-7 10-7M7 12c5 0 5 7 10 7" />
    </svg>
  ),
  pulse: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />
    </svg>
  ),
};

/* Abstract operational-flow panel — a calm dark motif showing AI working across
   the operation (enquiries → Lumive → your tools). No metrics, charts, or claims. */
function HeroVisual() {
  const { t } = useLanguage();
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-sapphire/10 to-teal/10 blur-xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-midnight shadow-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
          <PrismMark className="h-5 w-5" tone="dark" />
          <span className="font-mono text-xs text-cloud/70">{t.hero.panelTitle}</span>
          <span className="ml-auto flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <i className="h-2.5 w-2.5 rounded-full bg-teal/60" />
          </span>
        </div>

        <div className="space-y-5 p-6">
          {/* capability chips — qualitative, no metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t.hero.panelChips[0], icon: ICON.flow },
              { label: t.hero.panelChips[1], icon: ICON.decide },
              { label: t.hero.panelChips[2], icon: ICON.pulse },
            ].map((c) => (
              <div key={c.label} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/12 text-lumive-light">
                  {c.icon}
                </span>
                <div className="mt-2 text-[11px] leading-tight text-cloud/70">{c.label}</div>
              </div>
            ))}
          </div>

          {/* abstract operational flow — enquiries converge through Lumive and out
              across your tools. No data, no numbers; just the shape of the work. */}
          <div className="rounded-md border border-white/8 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-cloud/80">{t.hero.panelFlow}</span>
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-teal" aria-hidden />
            </div>
            <svg viewBox="0 0 300 132" className="w-full" aria-hidden role="presentation">
              <defs>
                <linearGradient id="lumive-flow" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#1B3F72" />
                  <stop offset="60%" stopColor="#1A8C6B" />
                  <stop offset="100%" stopColor="#3DBFA3" />
                </linearGradient>
              </defs>
              {/* inputs converge → hub */}
              <path d="M48 40 C 96 40 104 66 134 66" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              <path d="M48 66 H134" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              <path d="M48 92 C 96 92 104 66 134 66" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              {/* hub → diverge across the stack */}
              <path d="M166 66 C 196 66 204 40 252 40" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              <path d="M166 66 H252" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              <path d="M166 66 C 196 66 204 92 252 92" className="flow-line" stroke="url(#lumive-flow)" strokeWidth="1.75" fill="none" />
              {/* input nodes */}
              <circle cx="44" cy="40" r="4.5" fill="#3DBFA3" />
              <circle cx="44" cy="66" r="4.5" fill="#3DBFA3" />
              <circle cx="44" cy="92" r="4.5" fill="#3DBFA3" opacity="0.6" />
              {/* output nodes */}
              <circle cx="256" cy="40" r="4.5" fill="#5B7FA6" />
              <circle cx="256" cy="66" r="4.5" fill="#5B7FA6" />
              <circle cx="256" cy="92" r="4.5" fill="#5B7FA6" opacity="0.6" />
              {/* hub */}
              <circle cx="150" cy="66" r="20" fill="#1A8C6B" opacity="0.12" />
              <circle cx="150" cy="66" r="20" stroke="#3DBFA3" strokeWidth="1.5" fill="none" className="animate-pulse-soft" />
              <circle cx="150" cy="66" r="6" fill="#3DBFA3" />
            </svg>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-cloud/45">
              <span>{t.hero.panelInbound}</span>
              <span>{t.hero.panelLumive}</span>
              <span>{t.hero.panelTools}</span>
            </div>
          </div>

          {/* agent line — qualitative, no numbers */}
          <div className="flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.03] p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/15">
              <PrismMark className="h-4 w-4" stroke={palette.lumiveLight} apex={palette.lumiveLight} />
            </span>
            <p className="text-[13px] leading-snug text-cloud/80">
              {t.hero.panelAgent}
            </p>
            <span className="ml-auto animate-pulse-soft text-teal">●</span>
          </div>
        </div>
      </div>
    </div>
  );
}
