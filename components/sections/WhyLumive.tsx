import { Reveal } from "../Reveal";

const POINTS = [
  {
    k: "We build, not advise",
    d: "The deliverable is a working system, not 47 recommendations. You can use it the day we hand it over.",
  },
  {
    k: "90 days",
    d: "A finite commitment, so the risk is bounded and the investment is known before you start.",
  },
  {
    k: "No dependency",
    d: "Success is your team running it confidently without us. We design for that from day one.",
  },
];

export function WhyLumive() {
  return (
    <section id="why" className="bg-mist">
      <div className="mx-auto max-w-container px-5 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-teal">
              Why Lumive
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-sapphire lg:text-4xl">
              We build it. We commit to a date. Then we leave.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.k} delay={i * 100}>
              <div data-tilt className="h-full rounded-lg border border-cloud/70 bg-white p-8 text-center transition-all duration-360 ease-enter hover:border-teal/40 hover:shadow-md">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 font-mono text-lg font-bold text-teal">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-sapphire">{p.k}</h3>
                <p className="mt-3 leading-relaxed text-steel">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
