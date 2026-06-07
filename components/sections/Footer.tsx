import { Logo } from "../Logo";
import { PlaceholderTag } from "../Placeholder";
import { ChannelButtons } from "../Channels";
import { Socials } from "../Socials";

const COLS = [
  {
    h: "Services",
    links: ["AI Solutions", "AI Agents", "Workflow automation", "Decision support"],
  },
  {
    h: "Company",
    links: ["About", "How it works", "Careers", "Case studies"],
  },
  {
    h: "Resources",
    links: ["Insights", "AI readiness guide", "Readiness check", "Pricing"],
  },
];

export function Footer() {
  return (
    <footer className="bg-midnight">
      <div className="mx-auto max-w-container px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* brand + newsletter */}
          <div>
            <Logo variant="light" withTagline />
            <p className="mt-5 max-w-sm leading-relaxed text-cloud/70">
              AI implementation for growing businesses. We build the infrastructure — not the
              deck. Real systems in 90 days.
            </p>

            <div className="mt-7 max-w-sm">
              <label className="font-mono text-[11px] uppercase tracking-wide text-cloud/60">
                One useful email, occasionally
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="focus-brand min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-mist placeholder:text-cloud/40"
                />
                <button className="focus-brand glow-cta rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-midnight transition-all hover:brightness-95">
                  Subscribe
                </button>
              </div>
            </div>

            <div className="mt-7">
              <p className="font-mono text-[11px] uppercase tracking-wide text-cloud/60">
                Talk to us directly
              </p>
              <ChannelButtons tone="dark" className="mt-3" />
            </div>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.h}>
                <h3 className="font-mono text-[11px] uppercase tracking-wide text-cloud/60">
                  {c.h}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-cloud/85 transition-colors hover:text-lumive-light">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <p className="text-sm text-cloud/55">
            © {new Date().getFullYear()} Lumive AI. <PlaceholderTag>contact + legal</PlaceholderTag>
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wide text-cloud/45">
                Follow Lumive
              </span>
              <Socials tone="dark" />
            </div>
            <div className="flex items-center gap-5 text-sm text-cloud/70">
              <a href="#" className="hover:text-lumive-light">Privacy</a>
              <a href="#" className="hover:text-lumive-light">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
