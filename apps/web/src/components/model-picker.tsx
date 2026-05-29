"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { listVirtualModels, type VirtualModel } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  workspaceId: string;
  value: string | null;
  onChange: (id: string) => void;
}

/**
 * Horizontal scroller of 80x80 thumbnails for virtual models.
 * Selected model gets the coral ring; an empty list renders a soft
 * placeholder pointing the user at the Models page.
 */
export function ModelPicker({ workspaceId, value, onChange }: ModelPickerProps) {
  const [models, setModels] = useState<VirtualModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listVirtualModels(workspaceId)
      .then((list) => {
        if (!cancelled) setModels(list);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-20 animate-pulse rounded-xl bg-[var(--af-stone-200)]/60"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-[var(--af-coral-500)]">无法加载模特：{error}</p>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--af-stone-200)] bg-white/40 px-4 py-3 text-sm text-[var(--af-stone-700)]">
        <Users className="h-4 w-4 opacity-60" />
        还没有模特，先到「模特库」创建一位
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {models.map((m) => {
        const selected = m.id === value;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            title={m.name}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--af-stone-200)]/40 transition-all",
              "ring-offset-2 ring-offset-[var(--af-stone-50)]",
              selected
                ? "ring-2 ring-[var(--af-coral-500)]"
                : "ring-1 ring-[var(--af-stone-200)] hover:ring-[var(--af-indigo-600)]/40"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.referenceImageUrl}
              alt={m.name}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1 py-1 text-[10px] text-white">
              {m.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
