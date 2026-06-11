import type { ReactNode } from "react";

/**
 * CTA hierarchy — a single source of truth for the three commitment tiers.
 *
 *  primary   → brass, highest weight. The earned action: "Book a 30-minute call".
 *  secondary → outline. A lower-commitment path: "See how the 90 days works".
 *  tertiary  → text link. Exploratory, mid-page: "Discuss your use case".
 *
 * Tier maps to a sound cue automatically (primary = "cta", others = "nav"), so
 * audio feedback reinforces the same hierarchy. Visual output matches the
 * site's existing button styling, so adoption is non-destructive.
 */

type Variant = "primary" | "secondary" | "tertiary";
type Tone = "light" | "dark";
type Size = "md" | "lg";

const SOUND: Record<Variant, string> = {
  primary: "cta",
  secondary: "nav",
  tertiary: "nav",
};

function buildClasses(variant: Variant, tone: Tone, size: Size, full: boolean) {
  const base =
    "focus-brand inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-brand";
  const width = full ? "w-full" : "";
  const pad = size === "lg" ? "px-8 py-4 text-base" : "px-7 py-3.5 text-base";

  if (variant === "primary") {
    return `${base} ${width} glow-cta rounded-md bg-brass ${pad} text-midnight shadow-md hover:brightness-95`;
  }
  if (variant === "secondary") {
    const tint =
      tone === "dark"
        ? "border border-mist/30 text-mist hover:bg-white/10"
        : "border border-sapphire/25 bg-white/60 text-sapphire hover:bg-white";
    return `${base} ${width} rounded-md ${pad} ${tint}`;
  }
  // tertiary
  const tint = tone === "dark" ? "text-mist hover:text-lumive-light" : "text-sapphire hover:text-teal";
  return `${base} ${tint}`;
}

export function CTAButton({
  variant = "primary",
  tone = "light",
  size = "md",
  href,
  onClick,
  type = "button",
  withArrow = false,
  fullWidth = false,
  className = "",
  children,
}: {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  withArrow?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cls = `${buildClasses(variant, tone, size, fullWidth)} ${className}`.trim();
  const arrow = withArrow ? (
    <span aria-hidden>→</span>
  ) : null;

  if (href) {
    // External links (e.g. the Cal.com booking page) open in a new tab.
    const external = /^https?:\/\//.test(href);
    const ext = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
    return (
      <a href={href} data-sound={SOUND[variant]} className={cls} {...ext}>
        {children}
        {arrow}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} data-sound={SOUND[variant]} className={cls}>
      {children}
      {arrow}
    </button>
  );
}
