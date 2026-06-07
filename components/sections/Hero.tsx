import { Reveal } from "../Reveal";
import { PrismMark } from "../Logo";
import { PlaceholderTag } from "../Placeholder";
import { Parallax } from "../Parallax";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";
import { ParallaxLayer } from "../ParallaxLayer";
import { palette } from "@/lib/brand";

export function Hero() {
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
              AI implementation, not advice
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-[clamp(2.6rem,5.2vw,4.25rem)] font-bold leading-[1.05] tracking-tight text-sapphire">
              AI that actually runs
              <br className="hidden sm:block" /> your business —{" "}
              <span className="gradient-text">live in 90 days.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-text text-lg leading-relaxed text-steel">
              We design and build the AI systems growing companies need, working inside your
              operations in 90 days. Not a strategy deck. A system your team runs.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTAButton variant="primary" href="#book">
                Book a 30-minute call
              </CTAButton>
              <CTAButton variant="secondary" href="#framework" withArrow>
                See how the 90 days works
              </CTAButton>
            </div>
            <Reassurance
              className="mt-4"
              items={["No pitch", "No obligation", "We tell you if it isn't a fit"]}
            />
          </Reveal>

          {/* stat strip */}
          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-cloud pt-7">
              {[
                { n: "90", l: "days to a live system" },
                { n: "0", l: "strategy decks delivered" },
                { n: "100%", l: "handed over to your team" },
              ].map((s) => (
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

/* Abstract "intelligent infrastructure" panel — a calm dark dashboard motif,
   honouring the brand's cool-blue, dashboard-glow photo direction without AI clichés. */
function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-sapphire/10 to-teal/10 blur-xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-midnight shadow-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
          <PrismMark className="h-5 w-5" tone="dark" />
          <span className="font-mono text-xs text-cloud/70">lumive · operations</span>
          <span className="ml-auto flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <i className="h-2.5 w-2.5 rounded-full bg-teal/60" />
          </span>
        </div>

        <div className="space-y-5 p-6">
          {/* metric row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "Hours saved / wk", v: "42" },
              { k: "Tasks automated", v: "1,280" },
              { k: "Manual errors", v: "−96%" },
            ].map((m) => (
              <div key={m.k} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                <div className="font-mono text-xl font-bold text-lumive-light">{m.v}</div>
                <div className="mt-1 text-[11px] leading-tight text-cloud/60">{m.k}</div>
              </div>
            ))}
          </div>

          {/* faux chart */}
          <div className="rounded-md border border-white/8 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-cloud/80">Workflow throughput</span>
              <span className="font-mono text-[11px] text-teal">live</span>
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {[34, 41, 38, 52, 49, 63, 58, 71, 80, 76, 88, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-sapphire to-teal"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* agent line */}
          <div className="flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.03] p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/15">
              <PrismMark className="h-4 w-4" stroke={palette.lumiveLight} apex={palette.lumiveLight} />
            </span>
            <p className="text-[13px] leading-snug text-cloud/80">
              Agent resolved 3 exceptions and routed 1 to a person.
            </p>
            <span className="ml-auto animate-pulse-soft text-teal">●</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <PlaceholderTag>illustrative — sample data</PlaceholderTag>
      </div>
    </div>
  );
}
