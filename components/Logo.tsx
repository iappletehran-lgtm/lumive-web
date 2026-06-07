import { logoColors, palette } from "@/lib/brand";

/**
 * Lumive AI mark — Concept #5 "Converge": two paths (primary + accent) resolving
 * into a single node with a luminous centre. A simplified picture of workflows and
 * CRM flows converging into one intelligent outcome.
 *
 * Colours come from the single source of truth (`logoColors` in lib/brand.ts) so
 * the mark is identical in every visual state. Pick the surface with `tone`:
 *   tone="light" (default) → mark on a LIGHT surface  (sapphire stroke, teal apex)
 *   tone="dark"            → mark on a DARK surface    (mist stroke, lumive apex)
 * `stroke`/`apex` still accept explicit overrides for special accent variants.
 * The node centre is always Lumive Light.
 */
export function LumiveMark({
  className = "",
  tone = "light",
  apex,
  stroke,
}: {
  className?: string;
  tone?: "light" | "dark";
  apex?: string;
  stroke?: string;
}) {
  const set = tone === "dark" ? logoColors.onDark : logoColors.onLight;
  const strokeColor = stroke ?? set.stroke;
  const apexColor = apex ?? set.apex;
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M16 33 C40 33 46 48 62 48" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />
      <path d="M16 63 C40 63 46 48 62 48" stroke={apexColor} strokeWidth="7" strokeLinecap="round" />
      <circle cx="68" cy="48" r="10" fill={strokeColor} />
      <circle cx="68" cy="48" r="4" fill={logoColors.node} />
    </svg>
  );
}

/** Backwards-compatible alias — existing imports of `PrismMark` keep working. */
export const PrismMark = LumiveMark;

export function Logo({
  variant = "dark",
  withTagline = false,
}: {
  variant?: "dark" | "light";
  withTagline?: boolean;
}) {
  // variant="light" = light text, i.e. the lockup sits ON a dark surface.
  const onDark = variant === "light";
  const word = onDark ? palette.mist : palette.sapphire;
  const tag = onDark ? palette.cloud : palette.slateIndigo;
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LumiveMark className="h-8 w-8 shrink-0" tone={onDark ? "dark" : "light"} />
      <span className="flex flex-col leading-none">
        {/* Wordmark uses Georgia per brand guide (logo only) */}
        <span
          style={{ fontFamily: "Georgia, serif", color: word }}
          className="text-[19px] font-bold tracking-tight"
        >
          LUMIVE <span style={{ color: palette.teal }}>AI</span>
        </span>
        {withTagline && (
          <span style={{ color: tag }} className="text-[10px] tracking-wide mt-0.5">
            Intelligence, made real.
          </span>
        )}
      </span>
    </span>
  );
}
