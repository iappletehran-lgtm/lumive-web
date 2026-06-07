/**
 * Lumive AI — Visual Identity System (code-side single source of truth).
 *
 * Mirrors the brand-governed spec in Lumive_Website/03_Design_System.md. Use
 * these tokens for any JS/SVG/inline-style needs so the brand stays identical
 * across every page and component. Tailwind utilities (bg-sapphire, text-steel,
 * bg-grad-brand, …) cover the className path; this covers the programmatic path.
 *
 * Do not introduce colours outside this palette — the brand guide governs.
 */

/** The 11 brand colours (brand guide §, design system §1). */
export const palette = {
  sapphire: "#1B3F72", // Deep Sapphire
  teal: "#1A8C6B", // Circuit Teal
  mist: "#E8EFF9", // Mist White
  brass: "#C9A84C", // Brass Signal
  slateIndigo: "#5B7FA6", // Slate Indigo
  lumiveLight: "#3DBFA3", // Lumive Light
  ember: "#F2746B", // Ember Red
  midnight: "#0E1C2F", // Midnight
  steel: "#4A5568", // Steel
  cloud: "#CBD5E0", // Cloud
  white: "#FFFFFF", // Pure White (print/minimal only)
} as const;

/**
 * Semantic roles — the palette mapped to intent. The 60/30/10 ratio holds:
 * ~60% canvas (Mist), ~30% structure (Sapphire/Midnight), ~10% accents.
 * Brass is rationed: it always means "act here".
 */
export const role = {
  primary: palette.sapphire, // structure, headings, the logo
  secondary: palette.teal, // accents, growth cues
  accent: palette.lumiveLight, // the spark — data highlights, active states
  cta: palette.brass, // conversion only
  canvas: palette.mist, // light backgrounds
  surfaceDark: palette.midnight, // dark backgrounds
  depth: palette.slateIndigo, // secondary structure, borders, depth
  textPrimary: palette.midnight, // body text on light
  textSecondary: palette.steel, // labels, captions
  border: palette.cloud, // dividers, hairlines
  danger: palette.ember, // errors/warnings only
} as const;

/**
 * Signature gradients — the recognizable Lumive blend (Sapphire → Teal →
 * Lumive Light). Keep these in sync with the --grad-* CSS variables defined
 * once in globals.css; the CSS vars are the live source for styling, these
 * strings are for canvas/SVG/inline-style use.
 */
export const gradients = {
  brand: "linear-gradient(100deg, #1B3F72 0%, #1A8C6B 60%, #3DBFA3 100%)",
  brandH: "linear-gradient(90deg, #1B3F72 0%, #1A8C6B 55%, #3DBFA3 100%)",
  spark: "linear-gradient(135deg, #1A8C6B 0%, #3DBFA3 100%)",
} as const;

/** Logo Concept #5 ("Converge") colours per surface. */
export const logoColors = {
  onLight: { stroke: palette.sapphire, apex: palette.teal },
  onDark: { stroke: palette.mist, apex: palette.lumiveLight },
  node: palette.lumiveLight, // the luminous centre is always Lumive Light
} as const;

/**
 * Icon system — every line icon shares one voice: no fill, currentColor stroke,
 * 1.8 weight, round caps/joins, 24-unit grid. Use the <Icon> component or these
 * props directly so icons never drift in weight or style.
 */
export const icon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Radii — soft, premium, not playful. */
export const radii = { sm: "6px", md: "10px", lg: "16px", pill: "999px" } as const;

/** Elevation — subtle only (the brand bans glows/drama). */
export const shadows = {
  sm: "0 1px 2px rgba(14,28,47,.06)",
  md: "0 4px 16px rgba(14,28,47,.08)",
  lg: "0 12px 32px rgba(14,28,47,.10)",
  xl: "0 24px 64px rgba(14,28,47,.14)",
} as const;

export type BrandColor = keyof typeof palette;
