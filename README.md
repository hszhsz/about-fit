<div align="center">

# AboutFit

**Open-source AI marketing studio purpose-built for apparel brands.**

Virtual models · Lookbooks · Copy · Size charts · Multi-platform export.

[简体中文](./README.zh-CN.md) · English

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

## ✨ Why AboutFit?

Generic AI image tools generate "a model wearing a dress" — but apparel brands need a **consistent virtual model** across an entire collection, on-fit fabric draping, and exportable assets that meet Taobao / Douyin / Shopify / TikTok Shop specs out of the box.

AboutFit is the first open-source tool that treats **apparel** as a first-class domain:

- 👗 **Garment-aware generation** — flat lay → on-model, fabric/material control, silhouette preservation
- 🧍 **Brand-locked virtual models** — pgvector-backed face/body embeddings keep the same model across SKUs and seasons
- 📐 **Size chart generator** — from a single tech pack, produce localized size tables (CN / US / EU / JP)
- 🎬 **Lookbook & short video** — collection-level storytelling, not single-image generation
- 🛒 **Platform presets** — one-click export to Taobao 主图 / Douyin 短视频 / Shopify hero / Amazon A+ specs
- 🌏 **i18n by default** — zh-CN, en-US, ja built in; the UI itself ships in three languages

## 🧱 Architecture (TL;DR)

Monorepo (pnpm + Turborepo) · Next.js 15 + React 19 frontend · NestJS backend · Postgres 16 + pgvector · Redis 7 + BullMQ · S3-compatible storage · Provider-adapter pattern for AI (DashScope / 即梦 Doubao / OpenAI / Replicate / ComfyUI / Fal.ai).

See [`docs/architecture.md`](./docs/architecture.md) for the full stack table and rationale.

## 📚 Documentation

| Doc | What's inside |
|---|---|
| [Brand & Logo](./docs/brand.md) | Brand positioning, logo prompt, color tokens |
| [Architecture](./docs/architecture.md) | Tech stack, module boundaries, data model |
| [Differentiation](./docs/differentiation.md) | Five moats vs. generic AI image tools |
| [Prompt 01 — Project Overview](./docs/prompts/01-overview.md) | For a coding agent: what to build |
| [Prompt 02 — UI / UX Spec](./docs/prompts/02-ui-ux.md) | Design language, layout, components |
| [Prompt 03 — Implementation Plan](./docs/prompts/03-implementation.md) | NestJS modules, delivery order, milestones |

## 🚀 Quick start

**Prerequisites:** Node ≥ 20.11, pnpm 9, Docker (with Compose v2).

```bash
git clone https://github.com/hszhsz/about-fit.git
cd about-fit

# One-key bootstrap: copies .env, boots Postgres + Redis + MinIO,
# installs deps, runs prisma migrations, creates buckets.
pnpm bootstrap

# Then start everything in one terminal:
pnpm dev
# …or scope to a single app:
#   pnpm --filter @about-fit/api dev      # http://localhost:4000/api
#   pnpm --filter @about-fit/web dev      # http://localhost:3000
#   pnpm --filter @about-fit/worker dev
```

| What you get | URL | Credentials |
|---|---|---|
| Web app | http://localhost:3000 | — |
| API | http://localhost:4000/api | — |
| MinIO console | http://localhost:9001 | `aboutfit` / `aboutfit-dev-secret` |

> **Need an API key?** Edit `.env` and set `DASHSCOPE_API_KEY` before generating renders or copy. Everything else (browsing, uploads, schema) works out of the box.

### Bootstrap variants

```bash
pnpm bootstrap          # provision only (idempotent, safe to re-run)
pnpm bootstrap:dev      # provision then auto-run `pnpm dev`
pnpm bootstrap:reset    # wipe Docker volumes (Postgres/Redis/MinIO) and reprovision
```

### Tear down

```bash
pnpm docker:down                                       # stop containers, keep volumes
docker compose -f infra/docker-compose.yml down -v     # also drop volumes
```

### Milestone status

- ✅ **M0** — Monorepo scaffolding (api / web / worker / packages)
- ✅ **M1** — Garment Studio MVP (upload, virtual models, on-model render with SSE)
- ✅ **M2** — Copy Studio (title / description / hashtags, zh-CN · en-US · ja, per-platform tuning)
- ✅ **M3** — Multi-platform Export (sharp resize + ZIP bundle, 11 platform presets)
- ⏳ **M4+** — Size charts, lookbook video, brand-locked face/body embeddings

## 🤝 Contributing

Issues and PRs welcome. Read the prompt docs in `docs/prompts/` to understand the intended architecture before opening a structural PR.

## 📄 License

Apache 2.0 — see [LICENSE](./LICENSE).
