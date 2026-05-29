# Prompt 01 — Project Overview (for Coding Agent)

> Paste this prompt into your coding agent as the first turn. It establishes scope, modules, and non-functional constraints.

---

You are building **AboutFit**, an open-source AI marketing studio for apparel brands. The product replaces a 5-person photoshoot team (model + photographer + stylist + retoucher + copywriter) for a single apparel-brand operator.

## Positioning (do not drift)

- **Vertical**: apparel only — no jewelry, no electronics, no furniture. Every abstraction must encode this (e.g., domain types are `Garment`, `Silhouette`, `Fabric`, not generic `Product`).
- **Buyer**: DTC apparel brands, Taobao/Tmall 服装店主, Shopify boutiques, TikTok Shop sellers, indie designers (1–10 people).
- **Tone**: editorial, quiet, craft. Closer to *Aritzia* / *COS* / *MUJI* than to *Temu*.

## Eight core modules (MVP scope, in delivery order)

| # | Module | One-line purpose |
|---|---|---|
| 1 | **Garment Studio** | Upload flat lay → pick virtual model → generate on-model image |
| 2 | **Model Library** | Manage brand-locked virtual models (face + body embeddings) |
| 3 | **Copy Studio** | Title / description / hashtag generation, brand-tone-locked |
| 4 | **Size Chart Generator** | Tech pack → localized size table (CN/US/EU/JP) |
| 5 | **Lookbook / Video** | Multi-shot collection storytelling, auto-cut short-form video |
| 6 | **Smart Editor** | Inpaint, background swap, fabric texture transfer |
| 7 | **Collection Workspace** | Kanban for an entire season; bulk operations |
| 8 | **Template Market** | Community-shared prompt + preset bundles |

Modules 1–3 are the MVP. Modules 4–6 are V1. Modules 7–8 are V2.

## The Brand Consistency Engine (most important architectural concept)

Every workspace owns a `VirtualModel` library. On model creation:

1. Extract 512-d face embedding (InsightFace) + 512-d body embedding (MediaPipe + custom head) from a reference image.
2. Store both in **pgvector** columns on the `VirtualModel` table.
3. On every downstream render, inject these embeddings into the AI provider via its consistency mechanism (DashScope `subject_image`, 即梦 `character_reference_id`, SDXL via IP-Adapter weights).

This is the single feature that justifies the product's existence — never compromise it for any other refactor.

## Non-functional requirements

- **TypeScript strict** everywhere. No `any` outside generated code.
- **All AI calls are async** via BullMQ jobs — HTTP handlers must return within 200ms.
- **Cost-attributable** — every `Render` row stores `provider`, `costCents`, `promptVersion`.
- **i18n-first** — every user-facing string ships in `zh-CN`, `en-US`, `ja` from day 1. No English-only screens.
- **Self-hostable** — `docker compose up` must produce a working dev environment with MinIO replacing S3.
- **No telemetry by default** — telemetry is opt-in per workspace.

## Out of scope (do not build)

- ❌ Inventory management, order fulfillment, payment — AboutFit is content-only.
- ❌ Generic product photography (electronics, food, etc.).
- ❌ Mobile native apps — responsive web only for now.
- ❌ Live-streaming digital human — explicitly excluded from MVP/V1.

## Success criteria for the MVP

A solo apparel designer can:

1. Sign up, create a workspace
2. Upload 1 reference photo, create their "house model"
3. Upload 10 flat-lay garment photos
4. Generate 10 on-model images with the house model — all 10 faces are recognizably the same person
5. Generate Chinese + English product titles + descriptions for all 10
6. Export all assets in Taobao 主图 (800×800 white BG) and Shopify hero (2048×2048 transparent) specs

…in **under 30 minutes total**, without writing a single prompt by hand.

---

Once you have read and understood this prompt, reply with: `READY — ASK FOR UI/UX SPEC`. Do not start coding yet.
