"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, X, Sparkles } from "lucide-react";
import {
  createVirtualModel,
  listVirtualModels,
  uploadFile,
  type VirtualModel,
} from "@/lib/api";
import { FileDropzone } from "@/components/file-dropzone";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export default function ModelsPage() {
  const params = useParams<{ workspace: string }>();
  const workspaceId = params.workspace;

  const [models, setModels] = useState<VirtualModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listVirtualModels(workspaceId);
      setModels(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleUpload = async (file: File) => {
    const url = await uploadFile(file, "virtual-model-reference");
    setReferenceUrl(url);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !referenceUrl) return;
    setSubmitting(true);
    try {
      await createVirtualModel(workspaceId, name.trim(), referenceUrl);
      setOpen(false);
      setName("");
      setReferenceUrl(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-violet-200/20 to-transparent blur-3xl" />

      {/* Header */}
      <header className="relative mb-8 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100/60 px-3 py-1 text-xs font-medium text-violet-600">
            <Sparkles className="h-3 w-3" />
            模特库
          </div>
          <h1
            className="mt-4 text-4xl font-medium italic text-indigo-950"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            虚拟模特
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            为您的品牌锁定一位虚拟模特
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 btn-press"
        >
          <Plus className="h-4 w-4" /> 新建模特
        </button>
      </header>

      {/* Error message */}
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {/* Models grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-gradient-to-br from-stone-200/60 to-stone-100/40"
            />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="还没有模特"
          description="您的"门面模特"决定了整季的视觉一致性。点击右上角「新建模特」上传一张参考照片。"
          action={
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              新建模特
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((m) => (
            <div
              key={m.id}
              className="group card-hover relative aspect-square overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.referenceImageUrl}
                alt={m.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-950/20 to-transparent" />
              {/* Name badge */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div
                  className="text-lg font-medium italic text-white"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {m.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="text-xs text-white/70">虚拟模特</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm px-4 transition-opacity"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal gradient header */}
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-2xl italic text-white"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    新建模特
                  </h2>
                  <p className="mt-1 text-xs text-white/70">
                    上传一张正面参考照，AboutFit 会提取面部 / 体型特征。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
                名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Linen 系列 · 一号"
                className="mb-5 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
              />

              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-stone-500">
                参考图
              </label>
              {referenceUrl ? (
                <div className="relative mb-5 overflow-hidden rounded-xl border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referenceUrl}
                    alt="reference"
                    className="h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setReferenceUrl(null)}
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-600 shadow-sm transition-colors hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mb-5">
                  <FileDropzone
                    onUpload={handleUpload}
                    hint="上传参考照片"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded-xl px-5 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-100"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!name.trim() || !referenceUrl || submitting}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                    name.trim() && referenceUrl && !submitting
                      ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      : "cursor-not-allowed bg-stone-100 text-stone-400"
                  )}
                >
                  {submitting ? "创建中…" : "创建模特"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}