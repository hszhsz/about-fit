# Architecture

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Monorepo | **pnpm + Turborepo** | Workspace isolation for `apps/web`, `apps/api`, `packages/*`; remote cache for CI |
| Frontend framework | **Next.js 15 (App Router) + React 19** | RSC for fast galleries, Server Actions for upload, edge runtime for previews |
| Language | **TypeScript 5.5 (strict)** | Required across all packages |
| Styling | **Tailwind CSS v4** | Zero-runtime, native CSS variables match our `--af-*` tokens |
| Component library | **shadcn/ui** | Copy-not-install, full control for apparel-specific components |
| State | **Zustand** (UI) + **TanStack Query v5** (server cache) | Avoid Redux ceremony; mutations are the 80% case |
| Forms | **react-hook-form + zod** | Single schema reused on server (NestJS pipes) |
| i18n | **next-intl** | Routing-aware, server-component friendly; ships zh-CN, en-US, ja |
| Backend framework | **NestJS 10** | Module system maps cleanly to our domain; first-class DI for AI providers |
| API style | **tRPC** (web↔api internal) + **REST/OpenAPI** (public, for SDK) | tRPC for type-safety inside the monorepo; REST for third parties |
| ORM | **Prisma 5** | Migrations, type-gen; pgvector support via `Unsupported("vector")` |
| Database | **PostgreSQL 16 + pgvector 0.7** | Single store for relational data + embeddings (virtual model identity vectors) |
| Cache & queue broker | **Redis 7** | Both LRU cache and BullMQ backing store |
| Job queue | **BullMQ** | Long-running AI jobs (60s–10min) decoupled from HTTP |
| Object storage | **S3-compatible** (MinIO dev, OSS/R2 prod) | Pre-signed uploads, lifecycle rules for drafts |
| AI providers | **Adapter pattern**: DashScope · Doubao 即梦 · OpenAI · Replicate · ComfyUI · Fal.ai | Pluggable; routing by capability + cost + region |
| Auth | **Auth.js v5** (web) + **JWT** (api) | Email-link + GitHub + WeChat work scan for CN buyers |
| Observability | **OpenTelemetry → Grafana Tempo / Loki / Mimir** | Single pane for traces, logs, metrics; cost-attributable AI spans |
| Feature flags | **GrowthBook (self-hosted)** | Experimental modules gated per workspace |
| CI / CD | **GitHub Actions → Docker → Helm** | Standard for OSS; turbo remote cache via Vercel artifact API |
| Testing | **Vitest** (unit) + **Playwright** (e2e) + **Storybook** (visual) | Visual regression critical for an image-heavy product |
| Docs | **Mintlify** (public) + **TypeDoc** (api ref) | Mintlify gives the apparel-tech tone for free |

## Module boundaries

```
apps/
  web/                     Next.js — operator-facing studio
  api/                     NestJS — domain logic + AI orchestration
  worker/                  BullMQ workers — long-running AI jobs
packages/
  ui/                      shadcn-based component library
  ai-providers/            Adapter implementations (one file per vendor)
  domain/                  Pure TS — Garment, Model, Lookbook, Collection types + zod
  prompts/                 Versioned prompt templates (markdown + JSON schema)
  platform-presets/        Taobao / Douyin / Shopify / TikTok / Amazon export specs
  config/                  ESLint, TS, Tailwind preset
```

## The eight core modules

1. **Garment Studio** — upload flat lay → segment garment → place on virtual model
2. **Model Library** — manage brand-locked virtual models (faces + bodies stored as pgvector embeddings)
3. **Copy Studio** — product title / description / hashtag generation, brand-tone-locked
4. **Size Chart Generator** — tech pack → localized size table with fit recommendations
5. **Lookbook / Video** — multi-shot collection storytelling, auto-cut short-form video
6. **Smart Editor** — inpaint, background swap, fabric texture transfer
7. **Collection Workspace** — Kanban for an entire season (Spring/Summer/…)
8. **Template Market** — community-shared prompt + preset bundles

## Data model (core entities)

```prisma
model Workspace { id String @id @default(cuid()) name String members User[] collections Collection[] }
model User      { id String @id email String @unique passkeys Passkey[] }
model Collection{ id String @id @default(cuid()) name String season String workspaceId String garments Garment[] lookbooks Lookbook[] }
model Garment   { id String @id @default(cuid()) sku String? flatlayUrl String segmentationMaskUrl String? fabric String silhouette String collectionId String renders Render[] }
model VirtualModel {
  id           String  @id @default(cuid())
  name         String
  faceEmbedding   Unsupported("vector(512)")
  bodyEmbedding   Unsupported("vector(512)")
  referenceImageUrl String
  workspaceId  String
}
model Render    { id String @id @default(cuid()) garmentId String virtualModelId String resultUrl String provider String costCents Int promptVersion String }
model Lookbook  { id String @id @default(cuid()) collectionId String shots LookbookShot[] }
model SizeChart { id String @id @default(cuid()) garmentId String region String json Json }
```

## Async job pattern

All AI calls go through BullMQ — never blocking HTTP:

```
client ──POST /renders──▶ api (NestJS)
                          │
                          ├─ creates Render row (status=queued)
                          └─ enqueues BullMQ job ─▶ worker
                                                    │
                                                    ├─ resolves provider via packages/ai-providers
                                                    ├─ uploads result to S3
                                                    └─ updates Render row (status=ready)
client ◀── SSE /renders/:id/stream ── api (subscribes to Redis pub/sub)
```

## Provider routing

`packages/ai-providers` exposes a single `generate(intent, payload)` function. Routing rules live in `config/provider-routing.yaml`:

- `intent: garment.on-model` → primary: Doubao 即梦, fallback: Replicate (SDXL + IP-Adapter)
- `intent: copy.product-title` → primary: DashScope qwen-max, fallback: OpenAI gpt-4o-mini
- `intent: video.lookbook` → primary: 即梦视频, fallback: Fal.ai (Kling)
- region `CN` always prefers domestic providers; `OVERSEAS` prefers OpenAI/Replicate

## Non-functional targets

| Metric | Target |
|---|---|
| P95 cold-start render submit → first preview | < 8s |
| P95 lookbook (6 shots) end-to-end | < 90s |
| Concurrent renders per workspace | 20 (free) / 200 (pro) |
| Storage retention for drafts | 30 days, lifecycle to cold tier |
| Uptime | 99.5% (community), 99.9% (managed offering) |
