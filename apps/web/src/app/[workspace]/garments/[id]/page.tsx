"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  createRender,
  getGarment,
  listRendersForGarment,
  type Garment,
  type Render,
} from "@/lib/api";
import { ModelPicker } from "@/components/model-picker";
import { RenderProgress } from "@/components/render-progress";
import { PlatformPresetBar } from "@/components/platform-preset-bar";
import { cn } from "@/lib/utils";

export default function GarmentDetailPage() {
  const params = useParams<{ workspace: string; id: string }>();
  const workspaceId = params.workspace;
  const garmentId = params.id;

  const [garment, setGarment] = useState<Garment | null>(null);
  const [renders, setRenders] = useState<Render[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);
  const [activeRender, setActiveRender] = useState<Render | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getGarment(garmentId), listRendersForGarment(garmentId)])
      .then(([g, rs]) => {
        if (cancelled) return;
        setGarment(g);
        setRenders(rs);
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
  }, [garmentId]);

  const handleGenerate = async () => {
    if (!modelId) return;
    setSubmitting(true);
    try {
      const r = await createRender(garmentId, modelId);
      setActiveRender(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReady = (resultUrl: string) => {
    if (!activeRender) return;
    setRenders((prev) => {
      const next = prev.filter((r) => r.id !== activeRender.id);
      return [{ ...activeRender, status: "ready", resultUrl }, ...next];
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--af-stone-200)]/60" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[var(--af-stone-200)]/60" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--af-stone-200)]/60" />
            <div className="h-20 animate-pulse rounded-xl bg-[var(--af-stone-200)]/60" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !garment) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/${workspaceId}/garments`}
          className="inline-flex items-center gap-1 text-sm text-[var(--af-stone-700)] hover:text-[var(--af-indigo-950)]"
        >
          <ArrowLeft className="h-4 w-4" /> 返回款式
        </Link>
        <p className="mt-6 text-sm text-[var(--af-coral-500)]">
          {error ?? "未找到该款式"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back */}
      <Link
        href={`/${workspaceId}/garments`}
        className="inline-flex items-center gap-1 text-sm text-[var(--af-stone-700)] transition-colors hover:text-[var(--af-indigo-950)]"
      >
        <ArrowLeft className="h-4 w-4" /> 返回款式
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Left: flatlay */}
        <div className="overflow-hidden rounded-2xl border border-[var(--af-stone-200)] bg-white">
          <div className="aspect-[3/4] bg-[var(--af-stone-200)]/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={garment.flatlayUrl}
              alt={garment.sku || garment.id}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="border-t border-[var(--af-stone-200)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
              SKU
            </p>
            <p className="mt-1 font-medium text-[var(--af-indigo-950)]">
              {garment.sku || garment.id}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <div>
            <h1
              className="text-3xl italic text-[var(--af-indigo-950)]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              生成上身效果
            </h1>
            <p className="mt-1 text-sm text-[var(--af-stone-700)]">
              选择一位虚拟模特，AboutFit 将为这件款式合成穿着图。
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--af-stone-200)] bg-white p-5">
            <h3 className="mb-3 text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
              选择模特
            </h3>
            <ModelPicker
              workspaceId={workspaceId}
              value={modelId}
              onChange={setModelId}
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!modelId || submitting}
              className={cn(
                "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all",
                modelId && !submitting
                  ? "bg-[var(--af-indigo-950)] text-white hover:bg-[var(--af-indigo-900)]"
                  : "cursor-not-allowed bg-[var(--af-stone-200)]/60 text-[var(--af-stone-700)]/70"
              )}
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? "正在创建任务…" : "生成上身图"}
            </button>
          </div>

          {activeRender ? (
            <RenderProgress
              renderId={activeRender.id}
              onReady={handleReady}
            />
          ) : null}
        </div>
      </div>

      {/* History */}
      <section className="mt-12">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--af-stone-700)]/80">
          渲染历史
        </h2>
        {renders.length === 0 ? (
          <p className="text-sm text-[var(--af-stone-700)]/70">
            还没有渲染记录。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {renders.map((r) => (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border border-[var(--af-stone-200)] bg-white"
              >
                <div className="aspect-[3/4] bg-[var(--af-stone-200)]/40">
                  {r.resultUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.resultUrl}
                      alt={r.id}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--af-stone-700)]/60">
                      {r.status}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--af-stone-700)]/70">
                  {r.status} · {r.provider ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Multi-platform export — only show if there's at least one ready render */}
      {renders.some((r) => r.status === "ready") && (
        <section className="mt-12">
          <PlatformPresetBar
            workspaceId={workspaceId}
            garmentId={garmentId}
          />
        </section>
      )}
    </div>
  );
}
