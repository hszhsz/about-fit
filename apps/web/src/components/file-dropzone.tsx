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
 * Modern drag-and-drop file picker with coral gradient accents.
 * Surfaces inline spinner while parent's onUpload promise is in-flight.
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
          "group relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-16 transition-all duration-300",
          dragOver
            ? "border-coral-400 bg-coral-50/80 scale-[1.01]"
            : "border-stone-300 bg-white/60 hover:border-coral-400/60 hover:bg-stone-100/40",
          uploading && "cursor-wait opacity-80"
        )}
      >
        {/* Gradient accent blob */}
        <div
          className={cn(
            "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-coral-200/40 to-transparent blur-2xl transition-opacity duration-300",
            dragOver ? "opacity-100" : "opacity-0 group-hover:opacity-60"
          )}
        />

        {/* Upload icon with gradient */}
        <div
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg",
            dragOver && "scale-110 shadow-glow-coral",
            "group-hover:scale-105"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <UploadCloud className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        <div className="relative text-center">
          <p className="text-base font-medium text-stone-700">
            {uploading ? "正在上传…" : hint}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            支持 JPG / PNG / WebP
          </p>
        </div>
      </button>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <span className="text-sm text-rose-600">{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}