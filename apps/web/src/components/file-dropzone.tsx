"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  hint?: string;
  className?: string;
}

/**
 * Drag-and-drop file picker. Handles click + drag-over + drop and
 * surfaces an inline spinner while the parent's onUpload promise
 * is in-flight. The parent owns all side effects (presign, POST, etc.).
 */
export function FileDropzone({
  onUpload,
  accept = "image/*",
  hint = "拖拽图片到此处，或点击上传",
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={uploading}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-16 transition-all",
          "border-[var(--af-stone-200)] bg-white/40 hover:border-[var(--af-indigo-600)]/60 hover:bg-[var(--af-indigo-600)]/5",
          dragOver &&
            "border-[var(--af-coral-500)] bg-[var(--af-coral-500)]/5 scale-[1.01]",
          uploading && "cursor-wait opacity-80"
        )}
      >
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            "bg-[var(--af-stone-200)]/60 text-[var(--af-indigo-900)]",
            "group-hover:bg-[var(--af-indigo-600)]/10 group-hover:text-[var(--af-indigo-600)]",
            dragOver && "bg-[var(--af-coral-500)]/15 text-[var(--af-coral-500)]"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>
        <p className="text-sm text-[var(--af-stone-700)]">
          {uploading ? "正在上传…" : hint}
        </p>
        <p className="text-xs text-[var(--af-stone-700)]/70">
          支持 JPG / PNG / WebP
        </p>
      </button>

      {error ? (
        <p className="mt-3 text-xs text-[var(--af-coral-500)]">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Reset so the same file can be picked twice in a row.
          e.target.value = "";
        }}
      />
    </div>
  );
}
