/**
 * Trust micro-elements — small, calm reassurance cues placed at the moment of
 * action. They make a CTA feel earned and lower the perceived risk of clicking,
 * without pressure or hype.
 *
 *  Reassurance → a row of short cues ("No pitch · No obligation").
 *  FoundingNote → soft, honest scarcity for a pre-launch, founder-led company.
 *                 Frames a small client count as a quality benefit (direct
 *                 founder involvement), never as urgency to "act now".
 */

type Tone = "light" | "dark";

const DEFAULT_CUES = ["30 minutes", "No pitch", "No obligation"];

export function Reassurance({
  items = DEFAULT_CUES,
  tone = "light",
  className = "",
}: {
  items?: string[];
  tone?: Tone;
  className?: string;
}) {
  const text = tone === "dark" ? "text-cloud/70" : "text-steel/75";
  const dot = tone === "dark" ? "bg-lumive-light/70" : "bg-teal/70";
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm ${text} ${className}`}>
      {items.map((cue) => (
        <li key={cue} className="inline-flex items-center gap-1.5">
          <span className={`h-1 w-1 rounded-full ${dot}`} aria-hidden />
          {cue}
        </li>
      ))}
    </ul>
  );
}

export function FoundingNote({
  tone = "light",
  className = "",
}: {
  tone?: Tone;
  className?: string;
}) {
  const wrap =
    tone === "dark"
      ? "border-white/15 bg-white/[0.04] text-cloud/85"
      : "border-brass/30 bg-brass/[0.06] text-steel";
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm ${wrap} ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-brass/50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brass" />
      </span>
      <span>Currently onboarding a small group of founding clients — each gets direct founder involvement.</span>
    </div>
  );
}
