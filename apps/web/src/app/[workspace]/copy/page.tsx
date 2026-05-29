"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles, Copy as CopyIcon, Loader2, AlertCircle, Check } from "lucide-react";
import {
  createCopy,
  listCopies,
  listGarments,
  subscribeCopyProgress,
  type CopyKind,
  type CopyRow,
  type Garment,
  type Locale,
  type PlatformId,
  type CopyVariantInput,
} from "@/lib/api";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const KINDS: { id: CopyKind; label: string }[] = [
  { id: "title", label: "标题" },
  { id: "description", label: "描述" },
  { id: "hashtags", label: "话题标签" },
];

const PLATFORMS: { id: PlatformId; label: string; group: "CN" | "Overseas" }[] = [
  { id: "taobao-main", label: "淘宝主图", group: "CN" },
  { id: "taobao-detail", label: "淘宝详情", group: "CN" },
  { id: "douyin-feed", label: "抖音 Feed", group: "CN" },
  { id: "xiaohongshu", label: "小红书", group: "CN" },
  { id: "shopify-hero", label: "Shopify", group: "Overseas" },
  { id: "tiktok-shop", label: "TikTok Shop", group: "Overseas" },
  { id: "instagram-feed", label: "Instagram Feed", group: "Overseas" },
  { id: "amazon-a-plus-banner", label: "Amazon A+", group: "Overseas" },
  { id: "generic", label: "通用", group: "CN" },
];

const LOCALES: { id: Locale; label: string }[] = [
  { id: "zh-CN", label: "中文" },
  { id: "en-US", label: "English" },
  { id: "ja", label: "日本語" },
];

export default function CopyStudioPage() {
  const params = useParams<{ workspace: string }>();
  const workspaceId = params.workspace;

  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [loadingGarments, setLoadingGarments] = useState(true);

  const [selectedKinds, setSelectedKinds] = useState<CopyKind[]>(["title", "description"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["xiaohongshu"]);
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live + historical results for the selected garment.
  const [results, setResults] = useState<CopyRow[]>([]);
  // Track open EventSource cleanups so navigating away doesn't leak.
  const subs = useRef<Map<string, () => void>>(new Map());

  // ---- Garments ----
  useEffect(() => {
    let cancelled = false;
    setLoadingGarments(true);
    listGarments(workspaceId)
      .then((rows) => {
        if (cancelled) return;
        setGarments(rows);
        if (rows.length > 0 && !selectedGarmentId) {
          setSelectedGarmentId(rows[0].id);
        }
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoadingGarments(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // ---- History reload when garment changes ----
  useEffect(() => {
    if (!selectedGarmentId) {
      setResults([]);
      return;
    }
    listCopies({ garmentId: selectedGarmentId, limit: 50 })
      .then(setResults)
      .catch((e) => setError(String(e)));
  }, [selectedGarmentId]);

  // ---- Cleanup all SSE subs on unmount ----
  useEffect(() => {
    return () => {
      subs.current.forEach((close) => close());
      subs.current.clear();
    };
  }, []);

  const toggleKind = (k: CopyKind) =>
    setSelectedKinds((cur) =>
      cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k],
    );

  const togglePlatform = (p: PlatformId) =>
    setSelectedPlatforms((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );

  const variantCount = selectedKinds.length * selectedPlatforms.length;

  const handleGenerate = async () => {
    if (!selectedGarmentId) return;
    if (variantCount === 0) {
      setError("请至少选择一种文案类型和一个平台");
      return;
    }
    if (variantCount > 12) {
      setError("一次最多生成 12 个文案变体,请减少类型或平台数量");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const variants: CopyVariantInput[] = [];
      for (const k of selectedKinds) {
        for (const p of selectedPlatforms) {
          variants.push({ kind: k, platform: p, locale });
        }
      }

      const created = await createCopy({
        garmentId: selectedGarmentId,
        workspaceId,
        variants,
        brief: brief.trim() || undefined,
      });

      // Prepend the new queued rows so the user sees them immediately.
      setResults((cur) => [...created, ...cur]);

      // Open one SSE per copy id; updates flow back into `results`.
      for (const row of created) {
        const close = subscribeCopyProgress(row.id, (ev) => {
          setResults((cur) =>
            cur.map((r) =>
              r.id === ev.copyId
                ? {
                    ...r,
                    status: ev.status,
                    text: ev.text ?? r.text,
                    errorMessage: ev.errorMessage ?? r.errorMessage,
                    provider: ev.provider ?? r.provider,
                    costCents: ev.costCents ?? r.costCents,
                  }
                : r,
            ),
          );
          if (ev.status === "ready" || ev.status === "failed") {
            const c = subs.current.get(ev.copyId);
            if (c) {
              c();
              subs.current.delete(ev.copyId);
            }
          }
        });
        subs.current.set(row.id, close);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* ---------- Left rail: garment picker + brief ---------- */}
      <aside className="col-span-4 space-y-6">
        <header>
          <h1
            className="text-3xl italic text-[var(--af-indigo-950)]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Copy Studio
          </h1>
          <p className="mt-1 text-sm text-[var(--af-stone-700)]">
            为已上传的服装一键生成多平台、多语言营销文案
          </p>
        </header>

        <section className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            选择服装
          </label>
          {loadingGarments ? (
            <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-400">
              加载中...
            </div>
          ) : garments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              暂无服装,请先在 Garment Studio 上传一件。
            </div>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
              {garments.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGarmentId(g.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition",
                    selectedGarmentId === g.id
                      ? "bg-[var(--af-coral-500)]/10 ring-1 ring-[var(--af-coral-500)]"
                      : "hover:bg-[var(--af-stone-200)]/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.flatlayUrl}
                    alt={g.sku ?? g.id}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {g.sku || g.id.slice(0, 8)}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {[g.fabric, g.silhouette, g.length].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            语言
          </label>
          <div className="flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm transition",
                  locale === l.id
                    ? "border-[var(--af-coral-500)] bg-[var(--af-coral-500)]/10 text-[var(--af-indigo-950)]"
                    : "border-[var(--af-stone-200)] text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/40",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            文案类型
          </label>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => toggleKind(k.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  selectedKinds.includes(k.id)
                    ? "border-[var(--af-coral-500)] bg-[var(--af-coral-500)]/10 text-[var(--af-indigo-950)]"
                    : "border-[var(--af-stone-200)] text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/40",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            目标平台
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  selectedPlatforms.includes(p.id)
                    ? "border-[var(--af-coral-500)] bg-[var(--af-coral-500)]/10 text-[var(--af-indigo-950)]"
                    : "border-[var(--af-stone-200)] text-[var(--af-stone-700)] hover:bg-[var(--af-stone-200)]/40",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
            额外指令 (可选)
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="例如:目标用户 25-35 岁通勤白领,强调通勤百搭"
            className="h-24 w-full rounded-lg border border-[var(--af-stone-200)] bg-white p-3 text-sm placeholder:text-[var(--af-stone-700)]/50 focus:border-[var(--af-coral-500)] focus:outline-none focus:ring-1 focus:ring-[var(--af-coral-500)]"
          />
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          disabled={!selectedGarmentId || submitting || variantCount === 0}
          onClick={handleGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--af-indigo-600)] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--af-indigo-900)] disabled:cursor-not-allowed disabled:bg-[var(--af-stone-200)] disabled:text-[var(--af-stone-700)]"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          生成 {variantCount > 0 ? `${variantCount} 个` : ""}文案
        </button>
      </aside>

      {/* ---------- Right column: results ---------- */}
      <main className="col-span-8">
        {results.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="An empty page, awaiting words."
            description="选择左侧的服装、平台和语言,点击生成,文案会实时流式出现在这里。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {results.map((r) => (
              <CopyCard key={r.id} row={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------

function CopyCard({ row }: { row: CopyRow }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!row.text) return;
    await navigator.clipboard.writeText(row.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const platformLabel =
    PLATFORMS.find((p) => p.id === row.platform)?.label ?? row.platform;
  const kindLabel = KINDS.find((k) => k.id === row.kind)?.label ?? row.kind;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {kindLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {platformLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {row.locale}
          </span>
        </div>
        <StatusPill status={row.status} />
      </header>

      <div className="min-h-[6rem] flex-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
        {row.status === "ready" && row.text}
        {row.status === "processing" && (
          <span className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            qwen-max 正在生成...
          </span>
        )}
        {row.status === "queued" && (
          <span className="text-slate-400">排队中</span>
        )}
        {row.status === "failed" && (
          <span className="text-rose-600">
            {row.errorMessage ?? "生成失败"}
          </span>
        )}
      </div>

      <footer className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>
          {row.provider ?? "—"}
          {row.costCents > 0 ? ` · ¥${(row.costCents / 100).toFixed(2)}` : ""}
        </span>
        <button
          disabled={!row.text}
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-1 transition hover:bg-slate-100 disabled:opacity-30"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> 已复制
            </>
          ) : (
            <>
              <CopyIcon className="h-3 w-3" /> 复制
            </>
          )}
        </button>
      </footer>
    </article>
  );
}

function StatusPill({ status }: { status: CopyRow["status"] }) {
  const map: Record<CopyRow["status"], string> = {
    queued: "bg-slate-100 text-slate-600",
    processing: "bg-amber-100 text-amber-700",
    ready: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide", map[status])}>
      {status}
    </span>
  );
}
