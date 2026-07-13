/**
 * Class-name joiner used by ui/ components (shadcn-style `cn`). Lightweight — no
 * clsx/tailwind-merge dependency — since the app otherwise composes classes with
 * plain template strings. Filters out falsy values and joins with a space.
 */
export type ClassValue = string | number | null | false | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
