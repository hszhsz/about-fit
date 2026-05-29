"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, X } from "lucide-react";
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
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1
            className="text-4xl italic text-[var(--af-indigo-950)]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            模特库
          </h1>
          <p className="mt-2 text-sm text-[var(--af-stone-700)]">
            为您的品牌锁定一位虚拟模特
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--af-indigo-950)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--af-indigo-900)]"
        >
          <Plus className="h-4 w-4" /> 新建模特
        </button>
      </header>

      {error ? (
        <p className="mb-4 text-sm text-[var(--af-coral-500)]">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-[var(--af-stone-200)]/60"
            />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="还没有模特"
          description="您的“门面模特”决定了整季的视觉一致性。点击右上角「新建模特」上传一张参考照片。"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((m) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--af-stone-200)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.referenceImageUrl}
                alt={m.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <p
                  className="text-sm italic text-white"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {m.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  className="text-2xl italic text-[var(--af-indigo-950)]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  新建模特
                </h2>
                <p className="mt-1 text-xs text-[var(--af-stone-700)]/80">
                  上传一张正面参考照，AboutFit 会提取面部 / 体型特征。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-full p-1 text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Linen 系列 · 一号"
              className="mb-5 w-full rounded-lg border border-[var(--af-stone-200)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--af-indigo-600)]"
            />

            <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--af-stone-700)]/70">
              参考图
            </label>
            {referenceUrl ? (
              <div className="relative mb-2 overflow-hidden rounded-xl border border-[var(--af-stone-200)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={referenceUrl}
                  alt="reference"
                  className="h-56 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReferenceUrl(null)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-[var(--af-stone-700)] shadow-sm hover:text-[var(--af-coral-500)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <FileDropzone
                onUpload={handleUpload}
                hint="上传参考照片"
              />
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-full px-4 py-2 text-sm text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim() || !referenceUrl || submitting}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  name.trim() && referenceUrl && !submitting
                    ? "bg-[var(--af-indigo-950)] text-white hover:bg-[var(--af-indigo-900)]"
                    : "cursor-not-allowed bg-[var(--af-stone-200)]/60 text-[var(--af-stone-700)]/70"
                )}
              >
                {submitting ? "创建中…" : "创建模特"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
