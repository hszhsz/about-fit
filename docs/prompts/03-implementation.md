# Prompt 03 — Backend + Frontend Implementation Plan (for Coding Agent)

> Use this prompt after the agent has confirmed `READY` to Prompt 02. It defines the actual implementation: modules, data model, milestones.

---

You are now implementing **AboutFit**. Build incrementally — never scaffold everything before any feature works.

## Repo layout (create exactly this)

```
about-fit/
├── apps/
│   ├── web/                    # Next.js 15 — operator-facing studio
│   ├── api/                    # NestJS — domain + AI orchestration
│   └── worker/                 # BullMQ workers
├── packages/
│   ├── ui/                     # shadcn-based component library
│   ├── ai-providers/           # one file per vendor; single generate() export
│   ├── domain/                 # pure TS: types + zod schemas
│   ├── prompts/                # versioned prompt templates (md + json schema)
│   ├── platform-presets/       # Taobao / Douyin / Shopify / TikTok / Amazon specs
│   └── config/                 # ESLint, TS, Tailwind preset
├── infra/
│   ├── docker-compose.yml      # dev: postgres+pgvector, redis, minio
│   └── helm/                   # prod chart
├── docs/                       # already created
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## NestJS modules (apps/api/src/modules/)

```
auth/             # Auth.js bridge + JWT issuance
workspaces/       # CRUD; member invitations
collections/      # Season/collection management
garments/         # Upload, segmentation enqueue, attribute extraction
virtual-models/   # Reference upload, embedding extraction, pgvector storage
renders/          # Render request → BullMQ enqueue → SSE stream
copy/             # Title / description / hashtag generation
size-charts/      # Tech pack parse → regional size table
lookbooks/        # Multi-shot composition
platforms/        # Export pipeline using packages/platform-presets
billing/          # Workspace tier + cost ledger (read from Render.costCents)
admin/            # Workspace settings, brand kit
```

Every module follows the pattern: `*.controller.ts` (HTTP), `*.service.ts` (logic), `*.dto.ts` (zod), `*.module.ts` (wiring). Tests in `*.spec.ts` colocated.

## Data model — generate the Prisma schema first

```prisma
generator client { provider = "prisma-client-js" previewFeatures = ["postgresqlExtensions"] }
datasource db    { provider = "postgresql" url = env("DATABASE_URL") extensions = [pgvector(map: "vector")] }

model Workspace { id String @id @default(cuid()) name String slug String @unique tier String @default("free") createdAt DateTime @default(now()) members WorkspaceMember[] collections Collection[] models VirtualModel[] }
model User { id String @id @default(cuid()) email String @unique name String? avatarUrl String? memberships WorkspaceMember[] }
model WorkspaceMember { id String @id @default(cuid()) workspaceId String userId String role String workspace Workspace @relation(fields:[workspaceId], references:[id]) user User @relation(fields:[userId], references:[id]) @@unique([workspaceId, userId]) }
model Collection { id String @id @default(cuid()) name String season String workspaceId String workspace Workspace @relation(fields:[workspaceId], references:[id]) garments Garment[] lookbooks Lookbook[] }
model Garment {
  id String @id @default(cuid())
  sku String?
  collectionId String
  flatlayUrl String
  segmentationMaskUrl String?
  fabric String?
  silhouette String?
  length String?
  status String @default("draft")
  collection Collection @relation(fields:[collectionId], references:[id])
  renders Render[]
  sizeChart SizeChart?
}
model VirtualModel {
  id String @id @default(cuid())
  workspaceId String
  name String
  referenceImageUrl String
  faceEmbedding Unsupported("vector(512)")
  bodyEmbedding Unsupported("vector(512)")
  workspace Workspace @relation(fields:[workspaceId], references:[id])
  renders Render[]
}
model Render {
  id String @id @default(cuid())
  garmentId String
  virtualModelId String
  status String @default("queued")
  provider String?
  costCents Int @default(0)
  promptVersion String
  resultUrl String?
  errorMessage String?
  createdAt DateTime @default(now())
  garment Garment @relation(fields:[garmentId], references:[id])
  virtualModel VirtualModel @relation(fields:[virtualModelId], references:[id])
}
model Lookbook { id String @id @default(cuid()) collectionId String name String shots LookbookShot[] collection Collection @relation(fields:[collectionId], references:[id]) }
model LookbookShot { id String @id @default(cuid()) lookbookId String order Int renderId String? caption String? lookbook Lookbook @relation(fields:[lookbookId], references:[id]) }
model SizeChart { id String @id @default(cuid()) garmentId String @unique region String json Json garment Garment @relation(fields:[garmentId], references:[id]) }
model BrandKit { id String @id @default(cuid()) workspaceId String @unique tone Json palette Json bannedWords String[] hashtags String[] }
```

## AI provider adapter (packages/ai-providers)

Single export:

```ts
export type Intent =
  | 'garment.on-model'
  | 'garment.segment'
  | 'garment.attribute-extract'
  | 'copy.product-title'
  | 'copy.product-description'
  | 'copy.hashtags'
  | 'size.infer'
  | 'video.lookbook'
  | 'edit.inpaint'
  | 'edit.background-swap';

export interface GenerateOptions {
  region?: 'CN' | 'OVERSEAS';
  preferredProvider?: string;
  consistency?: { faceEmbedding?: number[]; bodyEmbedding?: number[] };
  workspaceId: string;
}

export async function generate(intent: Intent, payload: unknown, opts: GenerateOptions): Promise<{
  resultUrl?: string;
  text?: string;
  costCents: number;
  provider: string;
  raw: unknown;
}>;
```

Routing rules live in `config/provider-routing.yaml` and are loaded at startup. Each provider implementation is one file: `dashscope.ts`, `doubao-jimeng.ts`, `openai.ts`, `replicate.ts`, `comfyui.ts`, `fal.ts`.

## BullMQ queues (apps/worker)

| Queue | Concurrency | Avg duration |
|---|---|---|
| `garment.segment` | 10 | 3s |
| `garment.attribute-extract` | 10 | 1s |
| `render.on-model` | 5 | 30–90s |
| `lookbook.compose` | 2 | 60–180s |
| `video.generate` | 1 | 120–600s |
| `copy.generate` | 20 | 2–8s |

Every job emits progress events to Redis pub/sub on `render:${renderId}:progress`. The API exposes `GET /renders/:id/stream` as SSE that subscribes to that channel.

## Frontend route map (apps/web/app/[locale])

```
/                              → Marketing landing (RSC, fully static)
/login                         → Auth.js sign-in
/[workspace]                   → Home dashboard
/[workspace]/garments          → Garment Studio
/[workspace]/garments/[id]     → Garment detail + render history
/[workspace]/models            → Model Library
/[workspace]/models/[id]       → Model detail
/[workspace]/copy              → Copy Studio
/[workspace]/sizes             → Size Chart Generator
/[workspace]/lookbooks         → Lookbook list
/[workspace]/lookbooks/[id]    → Lookbook editor
/[workspace]/collections       → Collection Kanban (the V2 module)
/[workspace]/templates         → Template Market
/[workspace]/settings/*        → Workspace settings
```

`[locale]` is one of `zh-CN`, `en-US`, `ja`. Use next-intl middleware for routing.

## Delivery milestones

### M0 — Scaffolding (week 1)
- Repo layout, Turborepo, pnpm workspace
- `docker compose up` boots postgres+pgvector, redis, minio
- Prisma schema migrates clean
- Auth.js sign-in works (email magic link)
- One smoke e2e test passes

### M1 — Garment Studio MVP (weeks 2–3)
- Upload flat lay → SAM 2 segmentation → attribute extraction
- Create VirtualModel from reference image (embedding stored in pgvector)
- Render on-model image with consistency injection (DashScope or 即梦)
- SSE progress stream
- View render history per garment

### M2 — Copy Studio (week 4)
- Product title/description/hashtag generation
- BrandKit drawer wired in
- Per-language output (zh-CN, en-US, ja)

### M3 — Multi-platform export (week 5)
- PlatformPresetBar component
- Bulk export job
- Download as ZIP

### M4 — Size Chart Generator (week 6)
- Tech pack parsing (PDF/image OCR)
- Regional size table generation
- Export to Shopify metafield JSON

### M5 — Lookbook + Video (weeks 7–8)
- Multi-shot composition UI
- Video generation via 即梦视频 / Kling
- Auto-cut short-form 9:16

### M6 — Collection Workspace (weeks 9–10)
- Kanban view with state machine
- Bulk operations (apply model to N garments)
- Coverage dashboard

### M7 — Template Market (weeks 11–12)
- Community-shared prompt + preset bundles
- Install / fork / star

## Definition of Done (per PR)

- ✅ TypeScript strict passes
- ✅ Lint clean (ESLint + Prettier)
- ✅ Unit tests for new service methods
- ✅ Storybook story for new UI components
- ✅ i18n strings added to all 3 locales (no English fallback in zh/ja)
- ✅ Cost-attributable: any new AI call writes to Render.costCents
- ✅ Loom or short GIF in PR description for UI changes

---

Start with M0. After each milestone, post a recap and wait for human review before starting the next.
