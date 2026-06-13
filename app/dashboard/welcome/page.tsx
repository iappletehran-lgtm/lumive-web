import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

const NEXT_STEPS = [
  "We review your details and the fit for a 90-day build.",
  "A founder — not a sales rep — replies within 24 hours.",
  "If it makes sense, we book a 30-minute call to go deeper.",
];

export default async function WelcomePage() {
  const profile = await requireRole("prospect");
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <DashboardShell
      eyebrow="Account created"
      title={
        <>
          Welcome, <span className="gradient-text">{firstName}.</span>
        </>
      }
      subtitle="Thanks for creating an account. Here is exactly what happens next."
      email={profile.email}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* Review status */}
        <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lumive-light/15 text-lumive-light">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-teal">Status</p>
              <p className="text-lg font-semibold text-sapphire">Under review</p>
            </div>
          </div>
          <p className="mt-5 leading-relaxed text-steel">
            Your account is with our team now. We read every one ourselves, so the
            reply you get is considered — and from a person who could do the work.
            Expect to hear back <span className="font-medium text-midnight">within 24 hours</span>.
          </p>

          <ul className="mt-7 space-y-3.5">
            {NEXT_STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/12 font-mono text-[11px] font-semibold text-teal">
                  {i + 1}
                </span>
                <span className="leading-snug text-steel">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Their details on file */}
        <div className="glass-tint rounded-2xl border border-white/70 p-7 shadow-lg lg:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wide text-steel">On file</p>
          <dl className="mt-5 space-y-5">
            <Detail label="Name" value={profile.full_name || "—"} />
            <Detail label="Company" value={profile.company || "—"} />
            <Detail label="Email" value={profile.email || "—"} />
          </dl>
          <p className="mt-7 border-t border-cloud/70 pt-5 text-sm leading-relaxed text-steel/80">
            Something to add or correct before we reply? Reach us on the channels in
            the site footer and we will update your file.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-steel/60">{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-medium text-midnight">{value}</dd>
    </div>
  );
}
