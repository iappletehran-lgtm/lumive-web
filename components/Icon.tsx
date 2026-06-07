import type { ReactNode, SVGProps } from "react";

/**
 * Brand line-icon wrapper — enforces the single icon voice from the visual
 * identity system: no fill, currentColor stroke, 1.8 weight, round caps/joins,
 * 24-unit grid. New icons should render their <path>/<circle> children inside
 * this so weight and style never drift across the UI.
 *
 *   <Icon><path d="…" /></Icon>
 *
 * Colour is inherited via currentColor, so set it with a text-* utility on the
 * icon or a parent (e.g. text-sapphire, group-hover:text-teal).
 */
export function Icon({
  children,
  className = "h-6 w-6",
  strokeWidth = 1.8,
  ...props
}: {
  children: ReactNode;
  className?: string;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
