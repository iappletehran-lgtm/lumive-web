import { Reveal } from "../Reveal";
import { ChannelButtons } from "../Channels";
import { FoundingNote } from "../Reassurance";
import { ParallaxLayer } from "../ParallaxLayer";
import { ContactForm } from "./ContactForm";

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
                We reply within one business day.
              </p>

              <FoundingNote className="mt-7" />
            </div>
          </Reveal>

          {/* right — message form + booking */}
          <Reveal delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
