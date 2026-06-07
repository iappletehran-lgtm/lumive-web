import { Reveal } from "../Reveal";

export function ValueProp() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* left: the problem */}
          <Reveal>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                The problem
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
                Most AI projects stop at the slide deck.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-steel">
                You already know AI could save your business time and money. What you do not have
                is a clear, honest path from &ldquo;interesting&rdquo; to &ldquo;running in my
                company.&rdquo;
              </p>
              <p className="mt-4 text-lg leading-relaxed text-steel">
                Most firms hand over a strategy document and a vendor relationship that quietly
                stalls. We start somewhere else: with the system itself.
              </p>
            </div>
          </Reveal>

          {/* right: what we do */}
          <Reveal delay={120}>
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
                What we build
              </span>
              <div className="mt-6 space-y-4">
                {[
                  {
                    t: "Automated workflows",
                    d: "The repetitive work your team does by hand, done reliably in the background.",
                  },
                  {
                    t: "Decision-support tools",
                    d: "The numbers and signals you need to decide, in one place, in plain language.",
                  },
                  {
                    t: "Intelligent reporting",
                    d: "Reports that write themselves and tell you what changed and why.",
                  },
                ].map((item, i) => (
                  <div
                    key={item.t}
                    data-tilt
                    className="group flex gap-5 rounded-lg border border-cloud/70 bg-mist/40 p-6 transition-colors hover:border-teal/40 hover:bg-mist"
                  >
                    <span className="font-mono text-sm font-bold text-teal">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-sapphire">{item.t}</h3>
                      <p className="mt-1.5 leading-relaxed text-steel">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* honesty block */}
        <Reveal delay={80}>
          <div className="mt-16 rounded-lg border-l-4 border-brass bg-mist/50 px-7 py-6">
            <p className="font-serif text-xl leading-relaxed text-sapphire lg:text-2xl">
              We will not tell you AI is right for every part of your business. We will show you
              exactly where it is — and where it is not worth the investment.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
