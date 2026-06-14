import { Reveal } from "../Reveal";
import { CTAButton } from "../CTA";
import { ParallaxLayer } from "../ParallaxLayer";
import { ReceptionistFlow } from "./ReceptionistFlow";
import { BOOKING_URL } from "@/lib/contact";

const SERVICES = [
  {
    title: "AI Receptionist",
    desc: "Answers inbound enquiries by chat, web, or phone — greets people, answers questions, books appointments, and qualifies leads, around the clock.",
    outcome: "No missed enquiries. Faster response. Less front-desk work.",
    icon: "receptionist",
    feature: true,
  },
  {
    title: "AI Chat Systems",
    desc: "Custom AI chat for your website and your team — trained on your business and built into your tools, not a generic bot.",
    outcome: "More visitors converted. Fewer repeat questions.",
    icon: "chat",
  },
  {
    title: "Workflow Automation",
    desc: "We orchestrate the repetitive, rule-based work that moves between your tools.",
    outcome: "Hours saved each week.",
    icon: "flow",
  },
  {
    title: "CRM Automation Flows",
    desc: "Capture and route leads, trigger follow-ups, and keep records current automatically.",
    outcome: "Fewer deals going cold.",
    icon: "crm",
  },
  {
    title: "Intelligent Reporting",
    desc: "Reporting that updates itself and explains what changed, ready when you need it.",
    outcome: "See reality sooner. Decide with evidence.",
    icon: "report",
  },
  {
    title: "Custom AI Agents",
    desc: "Software that handles a defined job end to end — and knows when to hand off to a person.",
    outcome: "Throughput without added headcount.",
    icon: "agent",
  },
];

function Icon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "receptionist":
      return <svg className={className} viewBox="0 0 24 24" {...p}><path d="M4 13v-1a8 8 0 0116 0v1" /><path d="M4 13a2 2 0 012 2v2a2 2 0 01-2 2 1 1 0 01-1-1v-4a1 1 0 011-1zM20 13a2 2 0 00-2 2v2a2 2 0 002 2 1 1 0 001-1v-4a1 1 0 00-1-1z" /><path d="M18 19a4 4 0 01-4 3h-2" /></svg>;
    case "chat":
      return <svg className={className} viewBox="0 0 24 24" {...p}><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></svg>;
    case "flow":
      return <svg className={className} viewBox="0 0 24 24" {...p}><circle cx="5" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="12" r="2" /><path d="M7 6h6a2 2 0 012 2v2M7 18h6a2 2 0 002-2v0" /></svg>;
    case "crm":
      return <svg className={className} viewBox="0 0 24 24" {...p}><path d="M3 7h4l1 10H4zM10 7h4l-.5 10h-3zM17 7h4l-1 10h-3" /><path d="M5 7V5h14v2" /></svg>;
    case "report":
      return <svg className={className} viewBox="0 0 24 24" {...p}><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v6h6M9 14h6M9 17h4" /></svg>;
    default:
      return <svg className={className} viewBox="0 0 24 24" {...p}><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 8V5M9 13h.01M15 13h.01M9 16h6" /></svg>;
  }
}

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-gradient-to-b from-mist/50 via-white to-white">
      <ParallaxLayer speed={0.08} className="pointer-events-none absolute -left-32 top-24">
        <div className="orb animate-float-slow h-[360px] w-[360px] bg-teal/10" />
      </ParallaxLayer>
      <div className="relative mx-auto max-w-container px-5 py-24 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                Core services
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                We design and build working AI systems — only what earns its place.
              </h2>
            </div>
            <CTAButton variant="tertiary" href={BOOKING_URL} withArrow className="shrink-0 text-base">
              Discuss your use case
            </CTAButton>
          </div>
        </Reveal>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const feature = s.feature;
            return (
              <Reveal
                key={s.title}
                delay={(i % 3) * 90}
                className={feature ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}
              >
                <div
                  data-tilt
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 shadow-sm transition-all duration-360 ease-enter hover:-translate-y-1 hover:shadow-lg ${
                    feature
                      ? "glass-tint p-8 lg:p-10"
                      : "glass p-7"
                  }`}
                >
                  {/* hover glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal/0 blur-2xl transition-colors duration-720 ease-io group-hover:bg-teal/15" aria-hidden />

                  <div className="relative flex items-center justify-between">
                    <span className={`flex items-center justify-center rounded-xl bg-sapphire/8 text-sapphire transition-colors duration-360 ease-io group-hover:bg-teal/12 group-hover:text-teal ${feature ? "h-14 w-14" : "h-12 w-12"}`}>
                      <Icon name={s.icon} className={feature ? "h-7 w-7" : "h-6 w-6"} />
                    </span>
                    {feature && (
                      <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-teal">
                        Always on · 24/7
                      </span>
                    )}
                  </div>

                  <h3 className={`relative mt-5 font-semibold text-sapphire ${feature ? "text-2xl" : "text-lg"}`}>
                    {s.title}
                  </h3>
                  <p className={`relative mt-2 leading-relaxed text-steel ${feature ? "text-lg max-w-md" : ""}`}>
                    {s.desc}
                  </p>

                  {feature && (
                    <div className="relative mt-6">
                      <ReceptionistFlow />
                    </div>
                  )}

                  <p className="relative mt-auto flex items-start gap-2 pt-5 text-sm font-medium text-teal">
                    <span aria-hidden className="mt-0.5">→</span>
                    <span>{s.outcome}</span>
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
