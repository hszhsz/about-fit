import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Editorial empty state with warm, inviting design.
 * Uses Fraunces italic for titles and coral accents for visual interest.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-stone-200/80 bg-white px-8 py-20 text-center shadow-soft",
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-coral-100/50 to-transparent blur-2xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-2xl" />

      {/* Icon with gradient background */}
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
          {icon}
        </div>
      </div>

      <h3
        className="relative text-3xl font-medium italic text-indigo-950"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {title}
      </h3>

      <p className="relative mt-3 max-w-md text-sm leading-relaxed text-stone-600">
        {description}
      </p>

      {action ? (
        <div className="relative mt-8">{action}</div>
      ) : null}
    </div>
  );
}