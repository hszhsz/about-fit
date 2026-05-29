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
 * Editorial empty state. Title uses Fraunces italic to lean into the
 * "magazine-style" voice of the product.
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
        "flex flex-col items-center justify-center rounded-2xl border border-[var(--af-stone-200)] bg-white/60 px-8 py-16 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--af-stone-200)]/60 text-[var(--af-indigo-900)]">
        {icon}
      </div>
      <h3
        className="text-2xl italic text-[var(--af-indigo-950)]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--af-stone-700)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
