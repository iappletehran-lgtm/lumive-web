import { Reveal } from "../Reveal";
import { ChannelButtons } from "../Channels";
import { PlaceholderTag } from "../Placeholder";
import { CTAButton } from "../CTA";
import { Reassurance, FoundingNote } from "../Reassurance";
import { ParallaxLayer } from "../ParallaxLayer";

const EXPECT = [
  "A real conversation with the people who would do the work — not a sales rep.",
  "An honest read on whether AI is worth it for your business right now.",
  "A clear, specific first step — even if that step is not working with us.",
];

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-gradient-to-b from-white via-mist/40 to-mist">
      <ParallaxLayer speed={0.07} className="pointer-events-none absolute -right-24 top-10">
        <div className="orb animate-float h-[360px] w-[360px] bg-lumive-light/12" />
      </ParallaxLayer>
      <div className="relative mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          {/* left — invitation */}
          <Reveal>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                Contact
              </span>
              <h2 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-sapphire lg:text-5xl">
                Book your <span className="gradient-text">30-minute call.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-steel">
                No pitch, no pressure. We get into how your business works, where AI might create
                real value, and whether a 90-day build makes sense for you.
              </p>

              <ul className="mt-8 space-y-3">
                {EXPECT.map((e) => (
                  <li key={e} className="flex items-start gap-3 text-steel">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-xs text-teal">✓</span>
                    <span className="leading-snug">{e}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <p className="font-mono text-[11px] uppercase tracking-wide text-steel/70">
                  Prefer to message
                </p>
                <ChannelButtons tone="light" className="mt-3" />
              </div>
              <p className="mt-5 text-sm text-steel/70">
                We reply within one business day. <PlaceholderTag>confirm response time</PlaceholderTag>
              </p>

              <FoundingNote className="mt-7" />
            </div>
          </Reveal>

          {/* right — premium form / booking card */}
          <Reveal delay={120}>
            <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-9">
              <form className="space-y-5">
                <p className="text-sm text-steel/80">
                  Two details to start — the rest is optional.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name" id="c-name" placeholder="Your name" />
                  <Field label="Work email" id="c-email" type="email" placeholder="you@company.com" />
                </div>
                <Field label="Company" id="c-company" placeholder="Company name" optional />
                <div>
                  <label htmlFor="c-msg" className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
                    What are you trying to solve?
                    <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-steel/60">
                      Optional
                    </span>
                  </label>
                  <textarea
                    id="c-msg"
                    rows={3}
                    placeholder="A sentence is plenty — or leave it and we will ask on the call."
                    className="mt-2 w-full resize-none rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
                  />
                </div>

                <CTAButton variant="primary" type="submit" fullWidth>
                  Book a 30-minute call
                </CTAButton>
                <Reassurance
                  className="justify-center"
                  items={["Takes under a minute", "No spam", "We never share your details"]}
                />

                <div className="flex items-center gap-3 text-steel/50">
                  <span className="h-px flex-1 bg-cloud" />
                  <span className="font-mono text-[11px] uppercase tracking-wide">or</span>
                  <span className="h-px flex-1 bg-cloud" />
                </div>

                {/* calendar integration placeholder */}
                <a
                  href="#book"
                  data-sound="nav"
                  className="focus-brand flex items-center justify-center gap-2 rounded-md border border-sapphire/25 bg-white/60 px-6 py-3.5 text-base font-semibold text-sapphire transition-colors hover:bg-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
                  Pick a time that suits you
                </a>
                <p className="text-center text-[11px] text-steel/60">
                  <PlaceholderTag>demo</PlaceholderTag> Wire form to CRM and embed Cal.com / Calendly scheduler.
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
  optional = false,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wide text-steel">
        {label}
        {optional && (
          <span className="rounded bg-steel/10 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-steel/60">
            Optional
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-cloud bg-white/70 px-4 py-3 text-sm text-midnight placeholder:text-steel/50 focus:border-sapphire focus:bg-white focus:outline-none"
      />
    </div>
  );
}
