import { Reveal } from "../Reveal";
import { PlaceholderTag } from "../Placeholder";
import { CTAButton } from "../CTA";
import { Reassurance } from "../Reassurance";

export function Founder() {
  return (
    <section id="founder" className="bg-white">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          {/* portrait placeholder */}
          <Reveal>
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-cloud/70 bg-gradient-to-br from-sapphire/12 via-slate-indigo/10 to-teal/12">
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/60 text-2xl text-sapphire/40">
                    ◷
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wide text-steel/70">
                    Founder portrait
                  </span>
                  <PlaceholderTag>brand-style photo</PlaceholderTag>
                </div>
              </div>
            </div>
          </Reveal>

          {/* story */}
          <Reveal delay={120}>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                The people behind it
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                Founder-led, on purpose.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-steel">
                We started Lumive AI after seeing the same pattern repeat: capable businesses
                paying for AI strategy that never shipped. The tools existed. The gap was
                execution. So we built a company that does the part everyone else stops short of —
                the building.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-steel">
                We are early, and deliberately working with a small number of founding clients.
                That means direct founder involvement and a sharper engagement than you would get
                from a larger firm.
              </p>

              <div className="mt-7 flex items-center gap-4 rounded-lg border border-cloud/70 bg-mist/40 p-5">
                <div className="h-12 w-12 shrink-0 rounded-full bg-sapphire/15" />
                <div>
                  <p className="font-semibold text-sapphire">
                    [Founder name] <PlaceholderTag>confirm</PlaceholderTag>
                  </p>
                  <p className="text-sm text-steel">Co-Founder · [background / credibility]</p>
                </div>
              </div>

              <div className="mt-8">
                <CTAButton variant="primary" href="#book">
                  Book a 30-minute call
                </CTAButton>
                <Reassurance
                  className="mt-4"
                  items={["Direct with the founder", "No obligation", "Reply within one business day"]}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
