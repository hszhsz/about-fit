"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shirt, Plus, Sparkles } from "lucide-react";
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

const STATUS_TONE: Record<GarmentStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  segmented: { bg: "bg-indigo-100/60", text: "text-indigo-600", dot: "bg-indigo-500" },
  ready: { bg: "bg-emerald-100/60", text: "text-emerald-600", dot: "bg-emerald-500" },
  rendering: { bg: "bg-coral-100/60", text: "text-coral-600", dot: "bg-coral-500" },
  approved: { bg: "bg-emerald-100/60", text: "text-emerald-600", dot: "bg-emerald-500" },
  exported: { bg: "bg-violet-100/60", text: "text-violet-600", dot: "bg-violet-500" },
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
    const publicUrl = await uploadFile(file, "garment-flatlay");
    const garment = await createGarment(workspaceId, publicUrl);
    router.push(`/${workspaceId}/garments/${garment.id}`);
  };

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-coral-200/20 to-transparent blur-3xl" />

      {/* Header */}
      <header className="relative mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-coral-100/60 px-3 py-1 text-xs font-medium text-coral-600">
          <Sparkles className="h-3 w-3" />
          服装工作室
        </div>
        <h1
          className="mt-4 text-4xl font-medium italic text-indigo-950"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          您的款式
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          为您的款式生成上身效果图
        </p>
      </header>

      {/* Upload section */}
      <div className="relative mb-12">
        <FileDropzone
          onUpload={handleUpload}
          hint="上传平铺图开始 — 拖拽到这里，或点击选择"
        />
      </div>

      {/* Garments grid */}
      <section className="relative">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500">
            已上传 ({garments.length})
          </h2>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-gradient-to-br from-stone-200/60 to-stone-100/40"
              />
            ))}
          </div>
        ) : garments.length === 0 ? (
          <EmptyState
            icon={<Shirt className="h-6 w-6" />}
            title="还没有款式"
            description="上传第一张平铺图，AboutFit 将自动分割并生成上身效果。"
            action={
              <button
                onClick={() => document.querySelector<HTMLButtonElement>("input[type=file]")?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral-500 to-coral-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                上传款式
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {garments.map((g, idx) => (
              <Link
                key={g.id}
                href={`/${workspaceId}/garments/${g.id}`}
                className="group card-hover relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.flatlayUrl}
                    alt={g.sku || g.id}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Info section */}
                <div className="relative p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-indigo-950">
                      {g.sku || g.id.slice(0, 8)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
                        STATUS_TONE[g.status].bg,
                        STATUS_TONE[g.status].text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_TONE[g.status].dot)} />
                      {STATUS_LABEL[g.status]}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.fabric && (
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                        {g.fabric}
                      </span>
                    )}
                    {g.silhouette && (
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                        {g.silhouette}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}