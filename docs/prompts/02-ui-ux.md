# Prompt 02 — UI / UX Specification (for Coding Agent)

> Use this prompt after the agent has confirmed `READY` to Prompt 01. It defines visual language, layout skeleton, and apparel-specific components.

---

You are now designing the UI for **AboutFit**. Reference (for layout density and editorial tone, NOT for color or content): `https://d.design/`. AboutFit is **not** a clone — it must feel quieter, more editorial, and unmistakably apparel.

## Design language

- **Density**: spacious. Cards have generous whitespace. Never cram more than 3 columns on desktop primary content area.
- **Photography-first**: images are the hero. UI chrome retreats. Buttons are ghosted on image surfaces.
- **Editorial typography**: Fraunces (display) for headings ≥ 24px; Inter (UI) for everything else.
- **Color**: indigo `#1E1B4B` + coral `#FB7185` + warm stones (see `docs/brand.md` for full tokens). Never use pure black or pure white.
- **Motion**: 200ms ease-out for hover, 400ms ease-in-out for layout shifts. No bouncy springs.
- **Iconography**: Lucide, 1.5px stroke, never filled.
- **Dark mode**: yes, equally polished. Background `#0F0D2C` (`--af-indigo-950`).

## Layout skeleton

```
┌─────────────────────────────────────────────────────────────────────┐
│ Sidebar (240px)        │ Main canvas                                │
│ ─────────────          │ ──────────────                             │
│ [AboutFit mark]        │ ┌─ Breadcrumb / page title ─────────────┐ │
│                        │ │                                        │ │
│ ▼ Workspace switcher   │ │       PAGE CONTENT (scrollable)        │ │
│                        │ │                                        │ │
│ ⌂ Home                 │ │                                        │ │
│ 👗 Garment Studio      │ │                                        │ │
│ 🧍 Models              │ │                                        │ │
│ ✍ Copy                 │ │                                        │ │
│ 📐 Sizes               │ │                                        │ │
│ 🎬 Lookbooks           │ │                                        │ │
│ 🗂 Collections          │ │                                        │ │
│ 🛍 Templates            │ │                                        │ │
│                        │ │                                        │ │
│ ─────────              │ └────────────────────────────────────────┘ │
│ ⚙ Settings             │ ┌─ Right inspector (320px, collapsible) ┐ │
│ 👤 Account             │ │  Properties · History · Versions       │ │
└─────────────────────────────────────────────────────────────────────┘
```

- Sidebar collapses to icon-only at < 1280px.
- Right inspector collapses entirely at < 1024px (becomes a sheet).
- Mobile (< 768px): bottom tab bar with the top 4 modules.

## Apparel-specific components (custom, not in shadcn/ui)

### `<GarmentDropzone />`
- Accepts JPG/PNG/HEIC up to 20MB
- Shows segmentation preview within 2s of upload (SAM 2 client-side via WASM, fallback to server)
- Inline attribute chips: fabric (silk/denim/...), silhouette (A-line/sheath/...), length (mini/midi/maxi) — auto-filled, user-editable

### `<ModelCard />`
- Square aspect, 1:1
- Hover reveals: model name, embedding-quality score, # of times used this month
- Coral dot indicator when locked to current collection
- Click → opens model detail with face/body embedding visualization (2D projection of 512-d via UMAP)

### `<PlatformPresetBar />`
- Horizontal scrolling chip rail above export button
- Chips: `淘宝主图` `淘宝详情` `抖音 9:16` `Shopify Hero` `TikTok Shop` `Amazon A+` `Instagram` `小红书`
- Multi-select; "Export 5 selected" button fires a single bulk job

### `<CollectionKanban />`
- Columns = workflow states: `Sourcing` `Flat lay ready` `Model selected` `Rendering` `Approved` `Exported`
- Cards = garments (thumbnail + SKU + assignee)
- Drag between columns triggers backend state machine
- Filter bar: season, fabric, silhouette, status

### `<SizeChartTable />`
- Editable matrix: rows = sizes (XS/S/M/L/XL), columns = measurements (bust/waist/hip/length)
- Region tabs: 中国 / US / EU / Japan
- Auto-fill button: "Infer remaining cells from tech pack"
- Export: PNG / SVG / Shopify metafield JSON

### `<BrandKitDrawer />`
- Right-side drawer (Cmd+B)
- Tabs: Tone of voice · Color palette · Typography · Banned words · Hashtag library
- Every Copy Studio generation pulls from this drawer

### `<RenderTimeline />`
- Horizontal timeline showing all generations for a garment
- Each pill = one render attempt with provider badge + cost + thumbnail on hover
- Click to revert / fork / compare

## Empty states

Every empty state has:
1. An editorial illustration (single-color line drawing in coral)
2. A one-sentence tip (Fraunces italic)
3. A primary CTA button
4. A "Watch 30s demo" secondary link

Example for empty Model Library:
> *"Your house model is what makes a collection feel like yours."*
> [+ Create your first model] · Watch 30s demo

## Accessibility (non-negotiable)

- WCAG AA contrast for all text
- All interactive elements ≥ 44×44px touch target
- Focus rings: 2px coral, 2px offset
- Every image generation has alt-text auto-filled from garment attributes
- Reduced-motion respected via `prefers-reduced-motion`

## Reference patterns (study, don't copy)

- d.design — layout density, gallery-first home
- Linear.app — keyboard shortcut surfacing, command palette
- Arc browser — sidebar workspace switcher
- Notion gallery view — card flexibility
- Figma — right inspector pattern

---

Once you understand the UI/UX spec, reply with: `READY — ASK FOR IMPLEMENTATION PLAN`. Do not start coding yet.
