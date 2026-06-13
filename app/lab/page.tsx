import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/Reveal";
import { LumiveMark } from "@/components/Logo";
import { ChannelButtons } from "@/components/Channels";
import { LumiveGameMount } from "@/components/lab/LumiveGameMount";
import { BOOKING_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Lumive Lab — Experience AI in action",
  description:
    "Lumive Lab is where you experience practical AI first-hand — interactive demos, business simulations, and agent demonstrations that preview what we build inside real companies.",
};

type Status = "In development" | "Coming soon" | "Planned";

const EXPERIENCES: { title: string; desc: string; status: Status; icon: string }[] = [
  { title: "Interactive AI Experiences", desc: "Hands-on demos you can run in the browser to feel how AI behaves on real tasks.", status: "In development", icon: "spark" },
  { title: "AI Business Simulations", desc: "See how AI changes a real operation, modelled on the way your industry actually works.", status: "Coming soon", icon: "sim" },
  { title: "Educational AI Challenges", desc: "Short, guided challenges that show where AI helps — and, honestly, where it does not.", status: "Planned", icon: "learn" },
  { title: "Workflow Automation Demos", desc: "Watch a manual, repetitive process get automated step by step, end to end.", status: "In development", icon: "flow" },
  { title: "AI Agent Demonstrations", desc: "Live agents handling a defined job from input to outcome, with a human hand-off.", status: "In development", icon: "agent" },
  { title: "Experimental AI Tools", desc: "Early tools we are testing in the open before they become client systems.", status: "Coming soon", icon: "tool" },
  { title: "Browser-Based Experiences", desc: "No install, no signup. Run each experience from any device, in seconds.", status: "Planned", icon: "browser" },
  { title: "Future Integrations", desc: "Interactive scenarios and simulations that will expand the Lab over time.", status: "Planned", icon: "grid" },
];

function statusStyle(s: Status) {
  if (s === "In development") return "text-lumive-light border-lumive-light/40 bg-lumive-light/10";
  if (s === "Coming soon") return "text-brass border-brass/40 bg-brass/10";
  return "text-slate-indigo border-slate-indigo/40 bg-slate-indigo/10";
}

function LabIcon({ name }: { name: string }) {
  const c = "h-6 w-6";
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "sim":
      return <svg className={c} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M8 18v3M16 18v3M6 21h12" /></svg>;
    case "learn":
      return <svg className={c} viewBox="0 0 24 24" {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M7 9.5V15c0 1.1 2.2 2.5 5 2.5s5-1.4 5-2.5V9.5" /></svg>;
    case "flow":
      return <svg className={c} viewBox="0 0 24 24" {...p}><circle cx="5" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="12" r="2" /><path d="M7 6h6a2 2 0 012 2v2M7 18h6a2 2 0 002-2v0" /></svg>;
    case "agent":
      return <svg className={c} viewBox="0 0 24 24" {...p}><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 8V5M9 13h.01M15 13h.01M9 16h6" /></svg>;
    case "tool":
      return <svg className={c} viewBox="0 0 24 24" {...p}><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5z" /></svg>;
    case "browser":
      return <svg className={c} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 8h18M7 6h.01M10 6h.01" /></svg>;
    case "grid":
      return <svg className={c} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    default: // spark
      return <svg className={c} viewBox="0 0 24 24" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /><circle cx="12" cy="12" r="2.5" /></svg>;
  }
}

export default function LabPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* LUMIVE GAME — live AI interaction demo (added at the top) */}
        <section className="relative overflow-hidden bg-midnight pt-[72px]">
          <div className="mesh pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="pointer-events-none absolute -left-24 top-24 h-[360px] w-[360px] rounded-full bg-[#7C3AED]/12 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-container px-5 py-16 lg:px-8 lg:py-20">
            <Reveal>
              <div className="mx-auto max-w-xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[12px] font-medium uppercase tracking-wide text-lumive-light">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-lumive-light" />
                  Live demo
                </span>
                <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-mist">
                  Lumive Lab
                </h1>
                <p className="mt-3 text-lg font-medium text-lumive-light">
                  A live demonstration of AI interaction
                </p>
                <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-cloud/75">
                  LUMI is an AI companion that learns from how you interact with it. This is a real
                  example of what we build for our clients — not a scripted demo.
                </p>
                <ul className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-wide text-cloud/60">
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-lumive-light" /> Talk to it</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-teal" /> Complete missions</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-brass" /> Watch it change</li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mx-auto mt-12 w-full max-w-[440px]">
                <LumiveGameMount />
              </div>
            </Reveal>

            <Reveal delay={180}>
              <p className="mx-auto mt-8 max-w-md text-center text-sm text-cloud/55">
                Want an AI like this for your business?{" "}
                <a
                  href="/book"
                  data-sound="cta"
                  className="focus-brand rounded font-medium text-lumive-light underline-offset-2 transition-colors hover:text-mist hover:underline"
                >
                  Book a strategy call →
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* HERO */}
        <section className="relative overflow-hidden bg-midnight pt-[72px]">
          <div className="mesh pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="pointer-events-none absolute -right-24 top-10 h-[380px] w-[380px] rounded-full bg-lumive-light/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-container items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[12px] font-medium uppercase tracking-wide text-lumive-light">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-lumive-light" />
                  Lumive Lab · v0.1
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-6 text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-mist">
                  Experience AI <span className="text-lumive-light">in action.</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-text text-lg leading-relaxed text-cloud/80">
                  Lumive Lab is where AI stops being a conversation and becomes something you can
                  use. Interactive demos, business simulations, and live agents — each one a preview
                  of what we build inside real companies.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="#access" data-sound="lab" className="focus-brand glow-cta inline-flex items-center justify-center rounded-md bg-brass px-7 py-3.5 text-base font-semibold text-midnight shadow-md transition-all hover:brightness-95">
                    Request early access
                  </a>
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" data-sound="cta" className="focus-brand inline-flex items-center justify-center gap-2 rounded-md border border-mist/25 px-7 py-3.5 text-base font-semibold text-mist transition-colors hover:bg-white/10">
                    Book a 30-minute call
                  </a>
                </div>
                <p className="mt-4 text-sm text-cloud/60">
                  Experiences are in active development.
                </p>
              </Reveal>
            </div>

            {/* lab console visual */}
            <Reveal delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-lumive-light/10 to-sapphire/10 blur-xl" aria-hidden />
                <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-midnight shadow-xl">
                  <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3.5">
                    <LumiveMark className="h-5 w-5" tone="dark" />
                    <span className="font-mono text-xs text-cloud/70">lumive · lab console</span>
                    <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-lumive-light">
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-lumive-light" /> live
                    </span>
                  </div>
                  <div className="space-y-2.5 p-6 font-mono text-[13px] leading-relaxed">
                    <p className="text-cloud/50">→ initialising experience…</p>
                    <p className="text-cloud/80">agent: reading inbound enquiry</p>
                    <p className="text-cloud/80">agent: qualified lead · routing to pipeline</p>
                    <p className="text-lumive-light">workflow: 3 steps automated · 0 errors</p>
                    <p className="text-cloud/50">→ ready for input_</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* POSITIONING */}
        <section className="bg-white">
          <div className="mx-auto max-w-container px-5 py-20 lg:px-8">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                    What the Lab is
                  </span>
                  <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                    Not a demo reel. A place to put real AI in your hands.
                  </h2>
                </div>
                <p className="text-lg leading-relaxed text-steel">
                  Most companies talk about AI. The Lab lets you experience it — practical,
                  business-focused, and honest about what works. Everything here is built to the
                  same standard as the systems we deliver in 90 days, so what you try is a genuine
                  preview of what your business could run.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* EXPERIENCES GRID */}
        <section className="bg-mist">
          <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
            <Reveal>
              <div className="max-w-2xl">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                  The experiences
                </span>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                  Built to grow. Here is what is taking shape.
                </h2>
                <p className="mt-4 leading-relaxed text-steel">
                  The Lab expands over time. Each experience below is in development or planned —
                  request early access and we will let you know the moment one goes live.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCES.map((e, i) => (
                <Reveal key={e.title} delay={(i % 4) * 80}>
                  <div data-tilt className="group flex h-full flex-col rounded-lg border border-cloud/70 bg-white p-6 transition-all duration-360 ease-enter hover:-translate-y-1 hover:border-teal/40 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sapphire/8 text-sapphire transition-colors group-hover:bg-teal/12 group-hover:text-teal">
                        <LabIcon name={e.icon} />
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${statusStyle(e.status)}`}>
                        {e.status}
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-sapphire">{e.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-steel">{e.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CONNECTS TO BUSINESS */}
        <section className="bg-white">
          <div className="mx-auto max-w-container px-5 py-20 lg:px-8">
            <Reveal>
              <div className="rounded-2xl border border-cloud/70 bg-mist/40 p-8 lg:p-12">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                      From the Lab to your business
                    </span>
                    <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-sapphire lg:text-3xl">
                      Everything here previews what we build for real.
                    </h2>
                    <p className="mt-4 leading-relaxed text-steel">
                      The Lab is not a sandbox set apart from the work. When an experience proves
                      useful, it becomes the blueprint for a system we implement inside a business in
                      90 days. Try it here, then build it for real.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href="/#framework" className="focus-brand inline-flex items-center justify-center rounded-md border border-sapphire/25 px-6 py-3.5 font-semibold text-sapphire transition-colors hover:bg-white">
                      See the 90-day process
                    </a>
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="focus-brand glow-cta inline-flex items-center justify-center rounded-md bg-brass px-6 py-3.5 font-semibold text-midnight transition-all hover:brightness-95">
                      Book a 30-minute call
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* EARLY ACCESS */}
        <section id="access" className="relative overflow-hidden bg-sapphire">
          <div className="mesh pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-2xl px-5 py-24 text-center lg:px-8">
            <Reveal>
              <LumiveMark className="mx-auto h-11 w-11" tone="dark" />
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-mist lg:text-4xl">
                Be first into the Lab.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cloud/85">
                Request early access and we will let you know as each experience goes live. No spam,
                no noise — just the Lab, when it is ready for you.
              </p>
              <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="focus-brand min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-4 py-3 text-mist placeholder:text-cloud/50"
                />
                <button type="button" data-sound="lab" className="focus-brand glow-cta rounded-md bg-brass px-6 py-3 font-semibold text-midnight transition-all hover:brightness-95">
                  Request access
                </button>
              </form>

              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm text-cloud/70">Prefer to talk it through?</p>
                <ChannelButtons tone="dark" className="justify-center" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
