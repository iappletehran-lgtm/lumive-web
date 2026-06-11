import { Reveal } from "../Reveal";
import { CTAButton } from "../CTA";
import { BOOKING_URL } from "@/lib/contact";

const PHASES = [
  {
    n: "01",
    weeks: "Weeks 1–2",
    title: "Diagnose",
    body: "We learn how your business actually works and find where AI is worth it.",
    get: "A prioritised plan of what to build — and what to leave alone.",
  },
  {
    n: "02",
    weeks: "Weeks 3–4",
    title: "Design",
    body: "We design the system around your real workflow and data.",
    get: "A concrete design you approve before anything is built.",
  },
  {
    n: "03",
    weeks: "Weeks 5–11",
    title: "Build",
    body: "We build the system inside your existing operations and test it on your data.",
    get: "Working software, refined with your feedback.",
  },
  {
    n: "04",
    weeks: "Week 12",
    title: "Handover",
    body: "We train your team and hand over a system they can run without us.",
    get: "Infrastructure, documentation, and a confident team.",
  },
];

export function Framework() {
  return (
    <section id="framework" className="emerge-midnight relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-container px-5 py-24 lg:px-8 lg:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-lumive-light">
              The 90-day framework
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-mist lg:text-4xl">
              From first conversation to live system in 90 days.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-cloud/80">
              The 90 days is a commitment, not a slogan. Each step has a defined outcome and a
              date — so the risk is bounded and nothing surprises you.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((p, i) => (
            <Reveal key={p.n} delay={i * 90}>
              <div data-tilt className="group relative h-full rounded-lg border border-white/10 bg-white/[0.03] p-6 transition-all duration-360 ease-enter hover:border-teal/40 hover:bg-white/[0.06]">
                {/* connector dot */}
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 font-mono text-sm font-bold text-lumive-light">
                    {p.n}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-cloud/60">
                    {p.weeks}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-mist">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-cloud/75">{p.body}</p>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-teal">
                    You get
                  </span>
                  <p className="mt-1 text-sm leading-snug text-cloud/85">{p.get}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-col items-start gap-5 rounded-lg border border-white/10 bg-white/[0.03] p-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-cloud/85">
              <span className="font-semibold text-mist">The handover guarantee.</span> Our
              definition of success is your team running this without us. We stay until they can.
            </p>
            <CTAButton variant="primary" href={BOOKING_URL} className="shrink-0">
              Start with a diagnostic
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
