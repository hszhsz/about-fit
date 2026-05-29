"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Copy as CopyIcon,
  Loader2,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";
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

const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "zh-CN", label: "中文", flag: "🇨🇳" },
  { id: "en-US", label: "English", flag: "🇺🇸" },
  { id: "ja", label: "日本語", flag: "🇯🇵" },
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

  const [results, setResults] = useState<CopyRow[]>([]);
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
      setError("一次最多生成 12 个文案变体，请减少类型或平台数量");
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

      setResults((cur) => [...created, ...cur]);

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
    <div className="relative grid grid-cols-12 gap-6 p-6">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-coral-200/20 to-violet-200/10 blur-3xl" />

      {/* ---------- Left rail: controls ---------- */}
      <aside className="col-span-12 space-y-6 lg:col-span-4">
        {/* Header */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-coral-100/60 px-3 py-1 text-xs font-medium text-coral-600">
            <Sparkles className="h-3 w-3" />
            AI 文案工作室
          </div>
          <h1
            className="mt-4 text-3xl font-medium italic text-indigo-950"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            文案生成
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            为已上传的服装一键生成多平台、多语言营销文案
          </p>
        </div>

        {/* Garment picker */}
        <section className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
            选择服装
          </label>
          {loadingGarments ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-400">
              加载中...
            </div>
          ) : garments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-4 text-sm text-stone-500">
              暂无服装，请在服装工作室上传一件。
            </div>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2">
              {garments.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGarmentId(g.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                    selectedGarmentId === g.id
                      ? "bg-gradient-to-r from-coral-500/10 to-coral-100/20 ring-1 ring-coral-400/50"
                      : "hover:bg-stone-100/60",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.flatlayUrl}
                    alt={g.sku ?? g.id}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-stone-900">
                      {g.sku || g.id.slice(0, 8)}
                    </div>
                    <div className="truncate text-xs text-stone-500">
                      {[g.fabric, g.silhouette, g.length].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Language selector */}
        <section className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
            语言
          </label>
          <div className="flex gap-2">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition-all",
                  locale === l.id
                    ? "border-coral-400 bg-coral-50/80 text-coral-600 ring-1 ring-coral-400/30"
                    : "border-stone-200 text-stone-600 hover:bg-stone-100/60",
                )}
              >
                <span>{l.flag}</span>
                <span className="font-medium">{l.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Copy types */}
        <section className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
            文案类型
          </label>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => toggleKind(k.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all",
                  selectedKinds.includes(k.id)
                    ? "border-coral-400 bg-coral-50/80 text-coral-600"
                    : "border-stone-200 text-stone-600 hover:bg-stone-100/60",
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {k.label}
              </button>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
            目标平台
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-all",
                  selectedPlatforms.includes(p.id)
                    ? "border-coral-400 bg-coral-50/80 text-coral-600"
                    : "border-stone-200 text-stone-600 hover:bg-stone-100/60",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Brief */}
        <section className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
            额外指令 (可选)
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="例如：目标用户 25-35 岁通勤白领，强调通勤百搭"
            className="h-24 w-full resize-none rounded-xl border border-stone-200 bg-white p-4 text-sm placeholder:text-stone-400 focus:border-coral-400 focus:outline-none focus:ring-2 focus:ring-coral-400/20"
          />
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="text-sm text-rose-600">{error}</span>
          </div>
        )}

        {/* Generate button */}
        <button
          disabled={!selectedGarmentId || submitting || variantCount === 0}
          onClick={handleGenerate}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md transition-all",
            !selectedGarmentId || submitting || variantCount === 0
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-gradient-to-r from-coral-500 to-coral-600 text-white hover:shadow-lg hover:-translate-y-0.5 btn-press"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              生成 {variantCount > 0 ? `${variantCount} 个` : ""}文案
            </>
          )}
        </button>
      </aside>

      {/* ---------- Right column: results ---------- */}
      <main className="col-span-12 lg:col-span-8">
        {results.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title="An empty page, awaiting words."
            description="选择左侧的服装、平台和语言，点击生成，文案会实时流式出现在这里。"
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
    <article className="card-hover relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-soft">
      {/* Top accent line */}
      <div className="absolute left-0 top-0 right-0 h-0.5 bg-gradient-to-r from-coral-500 to-violet-500" />

      <header className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-coral-100/60 px-3 py-1 text-xs font-medium text-coral-600">
          {kindLabel}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
          {platformLabel}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
          {row.locale}
        </span>
        <StatusPill status={row.status} />
      </header>

      <div className="min-h-[6rem] flex-1 whitespace-pre-wrap rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-4 text-sm leading-relaxed text-stone-800">
        {row.status === "ready" && row.text}
        {row.status === "processing" && (
          <span className="flex items-center gap-2 text-stone-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            qwen-max 正在生成…
          </span>
        )}
        {row.status === "queued" && (
          <span className="flex items-center gap-2 text-stone-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            排队中…
          </span>
        )}
        {row.status === "failed" && (
          <span className="text-rose-600">
            {row.errorMessage ?? "生成失败"}
          </span>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>
          {row.provider ?? "—"}
          {row.costCents > 0 ? ` · ¥${(row.costCents / 100).toFixed(2)}` : ""}
        </span>
        <button
          disabled={!row.text}
          onClick={onCopy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
            copied
              ? "bg-emerald-100/60 text-emerald-600"
              : "hover:bg-stone-100 text-stone-600"
          )}
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
  const map: Record<CopyRow["status"], { bg: string; text: string; label: string }> = {
    queued: { bg: "bg-stone-100", text: "text-stone-600", label: "排队中" },
    processing: { bg: "bg-amber-100", text: "text-amber-600", label: "生成中" },
    ready: { bg: "bg-emerald-100/60", text: "text-emerald-600", label: "就绪" },
    failed: { bg: "bg-rose-100", text: "text-rose-600", label: "失败" },
  };
  const s = map[status];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", s.bg, s.text)}>
      {s.label}
    </span>
  );
}