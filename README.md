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

## 🚀 Quick start (placeholder)

```bash
# coming soon
pnpm install
pnpm dev
```

> The first milestone (M0 — scaffolding + Garment Studio MVP) is in progress. Track it on the [Projects board](https://github.com/hszhsz/about-fit/projects).

## 🤝 Contributing

Issues and PRs welcome. Read the prompt docs in `docs/prompts/` to understand the intended architecture before opening a structural PR.

## 📄 License

Apache 2.0 — see [LICENSE](./LICENSE).
