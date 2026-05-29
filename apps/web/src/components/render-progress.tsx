"use client";

import { useEffect, useState } from "react";
import { subscribeRenderProgress, type RenderStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RenderProgressProps {
  renderId: string;
  onReady?: (resultUrl: string) => void;
}

const STATUS_LABEL: Record<RenderStatus, string> = {
  queued: "排队中",
  processing: "生成中",
  ready: "完成",
  failed: "失败",
};

/**
 * Live progress card for a single render. Owns its EventSource and
 * tears it down on unmount or once the render reaches a terminal state.
 */
export function RenderProgress({ renderId, onReady }: RenderProgressProps) {
  const [status, setStatus] = useState<RenderStatus>("queued");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("queued");
    setProgress(0);
    setResultUrl(null);
    setError(null);

    const cleanup = subscribeRenderProgress(renderId, (ev) => {
      if (ev.status) setStatus(ev.status);
      if (typeof ev.progress === "number") {
        setProgress(Math.max(0, Math.min(100, ev.progress)));
      }
      if (ev.errorMessage) setError(ev.errorMessage);
      if (ev.status === "ready" && ev.resultUrl) {
        setResultUrl(ev.resultUrl);
        setProgress(100);
        onReady?.(ev.resultUrl);
      }
    });
    return cleanup;
  }, [renderId, onReady]);

  const isTerminal = status === "ready" || status === "failed";

  return (
    <div className="rounded-2xl border border-[var(--af-stone-200)] bg-white p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
          渲染进度
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            status === "failed"
              ? "text-[var(--af-coral-500)]"
              : "text-[var(--af-indigo-600)]"
          )}
        >
          {STATUS_LABEL[status]} · {Math.round(progress)}%
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--af-stone-200)]/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === "failed"
              ? "bg-[var(--af-coral-500)]"
              : "bg-[var(--af-indigo-600)]",
            !isTerminal && "animate-pulse"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {error ? (
        <p className="mt-3 text-xs text-[var(--af-coral-500)]">{error}</p>
      ) : null}

      {resultUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-[var(--af-stone-200)]/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="渲染结果"
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
