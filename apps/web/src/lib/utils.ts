import clsx, { type ClassValue } from "clsx";

/**
 * Tailwind-friendly class composer. We deliberately stay with clsx
 * (no tailwind-merge) because the design system uses arbitrary
 * values and conflicts are managed by hand at the component level.
 */
export function cn(...classes: ClassValue[]): string {
  return clsx(classes);
}
