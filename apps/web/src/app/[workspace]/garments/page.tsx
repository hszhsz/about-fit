"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shirt } from "lucide-react";
import {
  createGarment,
  listGarments,
  uploadFile,
  type Garment,
  type GarmentStatus,
} from "@/lib/api";
import { FileDropzone } from "@/components/file-dropzone";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<GarmentStatus, string> = {
  draft: "草稿",
  segmented: "已分割",
  ready: "就绪",
  rendering: "渲染中",
  approved: "已审批",
  exported: "已导出",
};

const STATUS_TONE: Record<GarmentStatus, string> = {
  draft: "bg-[var(--af-stone-200)]/60 text-[var(--af-stone-700)]",
  segmented: "bg-[var(--af-indigo-600)]/10 text-[var(--af-indigo-600)]",
  ready: "bg-emerald-100 text-emerald-700",
  rendering: "bg-[var(--af-coral-500)]/15 text-[var(--af-coral-500)]",
  approved: "bg-emerald-100 text-emerald-700",
  exported: "bg-[var(--af-indigo-950)]/10 text-[var(--af-indigo-950)]",
};

export default function GarmentsPage() {
  const params = useParams<{ workspace: string }>();
  const router = useRouter();
  const workspaceId = params.workspace;

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listGarments(workspaceId)
      .then((list) => {
        if (!cancelled) setGarments(list);
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

  const handleUpload = async (file: File) => {
    // For M1 we treat the workspace slug as the default collection id;
    // the backend M1 contract accepts it (collections are implicit).
    const publicUrl = await uploadFile(file, "garment-flatlay");
    const garment = await createGarment(workspaceId, publicUrl);
    router.push(`/${workspaceId}/garments/${garment.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <h1
          className="text-4xl italic text-[var(--af-indigo-950)]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          服装工作室
        </h1>
        <p className="mt-2 text-sm text-[var(--af-stone-700)]">
          为您的款式生成上身效果图
        </p>
      </header>

      {/* Upload */}
      <FileDropzone
        onUpload={handleUpload}
        hint="上传平铺图开始 — 拖拽到这里，或点击选择"
      />

      {/* Existing garments */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--af-stone-700)]/80">
            您的款式
          </h2>
          {!loading && (
            <span className="text-xs text-[var(--af-stone-700)]/60">
              共 {garments.length} 件
            </span>
          )}
        </div>

        {error ? (
          <p className="text-sm text-[var(--af-coral-500)]">{error}</p>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-xl bg-[var(--af-stone-200)]/60"
              />
            ))}
          </div>
        ) : garments.length === 0 ? (
          <EmptyState
            icon={<Shirt className="h-5 w-5" />}
            title="还没有款式"
            description="上传第一张平铺图，AboutFit 将自动分割并生成上身效果。"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {garments.map((g) => (
              <Link
                key={g.id}
                href={`/${workspaceId}/garments/${g.id}`}
                className="group block overflow-hidden rounded-xl border border-[var(--af-stone-200)] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--af-stone-200)]/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.flatlayUrl}
                    alt={g.sku || g.id}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="truncate text-sm font-medium text-[var(--af-indigo-950)]">
                    {g.sku || g.id.slice(0, 8)}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      STATUS_TONE[g.status]
                    )}
                  >
                    {STATUS_LABEL[g.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
