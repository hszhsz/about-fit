"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Package, Check, AlertCircle } from "lucide-react";
import {
  createExport,
  subscribeExportProgress,
  type PlatformId,
  type ExportBatch,
  type ExportProgressEvent,
  type ExportStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Preset metadata (kept in sync with packages/domain/src/platform-presets.ts).
 * Duplicated client-side so the web app doesn't need to ship the runtime
 * domain package; if this drifts, change both.
 */
const PRESET_META: Record<
  PlatformId,
  { label: string; size: [number, number]; group: string }
> = {
  "taobao-main": { label: "淘宝主图 800×800", size: [800, 800], group: "国内电商" },
  "taobao-detail": { label: "淘宝详情 750×1000", size: [750, 1000], group: "国内电商" },
  "douyin-feed": { label: "抖音 Feed 1080×1350", size: [1080, 1350], group: "国内内容" },
  "douyin-cover": { label: "抖音封面 1080×1440", size: [1080, 1440], group: "国内内容" },
  xiaohongshu: { label: "小红书 1080×1440", size: [1080, 1440], group: "国内内容" },
  "shopify-hero": { label: "Shopify Hero 2048×2560", size: [2048, 2560], group: "海外电商" },
  "tiktok-shop": { label: "TikTok Shop 1080×1080", size: [1080, 1080], group: "海外电商" },
  "amazon-a-plus-banner": { label: "Amazon A+ Banner 970×600", size: [970, 600], group: "海外电商" },
  "amazon-a-plus-square": { label: "Amazon A+ Square 300×300", size: [300, 300], group: "海外电商" },
  "instagram-feed": { label: "Instagram Feed 1080×1080", size: [1080, 1080], group: "海外内容" },
  "instagram-story": { label: "Instagram Story 1080×1920", size: [1080, 1920], group: "海外内容" },
};

const ALL_PRESETS = Object.keys(PRESET_META) as PlatformId[];

interface PlatformPresetBarProps {
  workspaceId: string;
  /** Required to scope the export. */
  garmentId?: string;
  /** If provided, exports just these renders; otherwise uses all ready renders for garmentId. */
  renderIds?: string[];
}

/**
 * Multi-platform export bar. Pick presets → click "Export" →
 * watch live progress → download ZIP.
 */
export function PlatformPresetBar({
  workspaceId,
  garmentId,
  renderIds,
}: PlatformPresetBarProps) {
  const [selected, setSelected] = useState<Set<PlatformId>>(
    new Set(["taobao-main", "xiaohongshu", "shopify-hero"]),
  );
  const [batch, setBatch] = useState<ExportBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perItem, setPerItem] = useState<
    Map<string, { status: ExportStatus; outputUrl?: string; errorMessage?: string }>
  >(new Map());

  const grouped = useMemo(() => {
    const g: Record<string, PlatformId[]> = {};
    for (const id of ALL_PRESETS) {
      const key = PRESET_META[id].group;
      g[key] ||= [];
      g[key].push(id);
    }
    return g;
  }, []);

  const toggle = (id: PlatformId) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleExport = async () => {
    if (selected.size === 0) {
      setError("请至少选择一个平台预设");
      return;
    }
    if (!garmentId && (!renderIds || renderIds.length === 0)) {
      setError("缺少导出来源 (garmentId 或 renderIds)");
      return;
    }
    setError(null);
    setSubmitting(true);
    setPerItem(new Map());
    try {
      const created = await createExport({
        workspaceId,
        presets: Array.from(selected),
        garmentId,
        renderIds,
      });
      setBatch(created);

      const close = subscribeExportProgress(created.id, (ev: ExportProgressEvent) => {
        setBatch((cur) => (cur ? {
          ...cur,
          status: ev.status,
          doneItems: ev.doneItems ?? cur.doneItems,
          totalItems: ev.totalItems ?? cur.totalItems,
          zipUrl: ev.zipUrl ?? cur.zipUrl,
          errorMessage: ev.errorMessage ?? cur.errorMessage,
        } : cur));
        if (ev.item) {
          setPerItem((m) => {
            const next = new Map(m);
            next.set(ev.item!.id, {
              status: ev.item!.status,
              outputUrl: ev.item!.outputUrl,
              errorMessage: ev.item!.errorMessage,
            });
            return next;
          });
        }
        if (ev.status === "ready" || ev.status === "failed") {
          close();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const isRunning = batch && (batch.status === "queued" || batch.status === "processing");
  const isDone = batch?.status === "ready";
  const pct = batch && batch.totalItems > 0
    ? Math.round((batch.doneItems / batch.totalItems) * 100)
    : 0;

  return (
    <section className="rounded-2xl border border-[var(--af-stone-200)] bg-white p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3
            className="text-lg italic text-[var(--af-indigo-950)]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Multi-platform Export
          </h3>
          <p className="mt-1 text-xs text-[var(--af-stone-700)]">
            选择目标平台,一键导出符合各平台尺寸规范的图片,并打包为 ZIP 下载。
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={submitting || Boolean(isRunning)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--af-indigo-600)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--af-indigo-900)] disabled:cursor-not-allowed disabled:bg-[var(--af-stone-200)] disabled:text-[var(--af-stone-700)]"
        >
          {submitting || isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Package className="h-4 w-4" />
          )}
          导出 {selected.size > 0 ? `${selected.size} 个平台` : ""}
        </button>
      </header>

      {/* Preset chips, grouped */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([group, ids]) => (
          <div key={group} className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
              {group}
            </span>
            {ids.map((id) => {
              const meta = PRESET_META[id];
              const active = selected.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  disabled={Boolean(isRunning)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-[var(--af-coral-500)] bg-[var(--af-coral-500)]/10 text-[var(--af-indigo-950)]"
                      : "border-[var(--af-stone-200)] text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/40",
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {batch && (
        <div className="mt-5 rounded-xl border border-[var(--af-stone-200)] bg-[var(--af-stone-50)] p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--af-stone-700)]">
              {batch.status === "queued" && "排队中..."}
              {batch.status === "processing" &&
                `处理中 · ${batch.doneItems}/${batch.totalItems} 已完成`}
              {batch.status === "ready" &&
                `完成 · ${batch.doneItems}/${batch.totalItems} 项`}
              {batch.status === "failed" &&
                `失败 · ${batch.errorMessage ?? "unknown error"}`}
            </div>
            {isDone && batch.zipUrl && (
              <a
                href={batch.zipUrl}
                download
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" /> 下载 ZIP
              </a>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--af-stone-200)]">
            <div
              className={cn(
                "h-full transition-all duration-300",
                batch.status === "failed"
                  ? "bg-rose-500"
                  : "bg-[var(--af-coral-500)]",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Per-item grid */}
          {perItem.size > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from(perItem.entries()).map(([itemId, st]) => (
                <div
                  key={itemId}
                  className="flex items-center justify-between gap-2 rounded-md border border-[var(--af-stone-200)] bg-white px-2 py-1.5 text-xs"
                >
                  <span className="truncate text-[var(--af-stone-700)]">
                    {itemId.slice(0, 8)}
                  </span>
                  {st.status === "ready" && (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  {st.status === "processing" && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  )}
                  {st.status === "failed" && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
