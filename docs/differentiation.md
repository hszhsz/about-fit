# Differentiation — Five Moats

What stops a buyer from just using Midjourney + ChatGPT + Canva? Five things that only make sense if you specialize in apparel.

## 1. Brand Consistency Engine (face & body lock)

**Problem**: every Midjourney generation gives you a different face. An apparel brand cannot ship a 40-SKU collection with 40 different models.

**Our solution**: every workspace owns a `VirtualModel` library. On first registration we extract a 512-d face embedding + 512-d body embedding (height, shoulder-to-hip ratio, skin tone bucket) using InsightFace + MediaPipe, store them in **pgvector**, and inject them into every downstream render via IP-Adapter / FaceID / 即梦角色一致性. Brands get a "house model" that stays the same across an entire season.

**Why competitors can't copy quickly**: requires deep integration between embedding storage, prompt assembly, and provider-specific consistency APIs (each AI vendor has a different mechanism — DashScope has 主体保持, 即梦 has 角色一致, SDXL needs IP-Adapter weights). Generic tools won't bother.

## 2. Garment-aware pipeline (segmentation + fabric + silhouette)

**Problem**: "a model wearing a red dress" is not enough. Real apparel shoots care about: does the **silk** drape correctly? Does the **A-line** silhouette read as A-line? Are the **knife pleats** preserved?

**Our solution**: every garment upload goes through a 3-step pre-process:

1. **Segmentation** — SAM 2 isolates the garment from the flat lay
2. **Attribute extraction** — a fine-tuned CLIP classifier tags `fabric ∈ {silk, denim, knit, linen, ...}`, `silhouette ∈ {A-line, sheath, oversized, ...}`, `length ∈ {mini, midi, maxi}`
3. **Prompt assembly** — these attributes are injected as control vectors + textual modifiers into the generation prompt, so the output respects the physical properties

**Result**: an A-line silk midi dress generates as an A-line silk midi dress — not a generic "red dress".

## 3. Multi-platform export presets

**Problem**: Taobao 主图 requires 800×800 white background; Douyin 短视频 requires 9:16 vertical; Shopify wants 2048×2048 transparent; Amazon A+ wants 970×600 banner. A photographer spends hours re-cropping per platform.

**Our solution**: `packages/platform-presets` ships JSON specs for every major platform:

```json
{
  "taobao.main": { "size": [800, 800], "format": "jpg", "background": "#FFFFFF", "watermark": false },
  "douyin.feed": { "size": [1080, 1920], "format": "mp4", "duration": [9, 15], "fps": 30 },
  "shopify.hero": { "size": [2048, 2048], "format": "webp", "background": "transparent" },
  "amazon.a-plus.banner": { "size": [970, 600], "format": "jpg", "background": "#FFFFFF" }
}
```

One click → all formats simultaneously, with platform-specific copy variants (Taobao wants 30-char titles, Amazon wants 200-char SEO titles).

## 4. Collection hierarchy

**Problem**: generic AI tools think in single images. Apparel brands think in **collections** (Spring 2026 → 6 themes → 40 SKUs → ~200 final images).

**Our solution**: native data model has `Collection → Garment → Render`. UI surfaces include:

- Collection Kanban (which SKUs still need lookbook shots?)
- Bulk operations (apply this new model to all 40 garments in the collection)
- Season templates (clone last year's S/S structure as starting point)
- Coverage dashboard (each SKU needs: 1 flat, 1 on-model front, 1 detail, 1 lifestyle — show gaps)

## 5. Sized for SMB apparel sellers (not enterprise / not hobbyist)

**Problem**: the market is bifurcated — either expensive enterprise PIM/DAM systems (Centric, Akeneo, $50k+/year) or hobbyist toys (Midjourney Discord).

**Our positioning**:

- Free self-host (Docker compose, one command)
- Managed offering at ¥299/month for the indie brand tier — cheaper than one outsourced photoshoot
- No "request a demo" wall — install in 10 minutes
- Workspace > Collection > Garment hierarchy matches how a 2-5 person brand actually thinks

## Summary

| Moat | Generic AI tools | AboutFit |
|---|---|---|
| Same model across SKUs | ❌ random faces | ✅ pgvector-locked identity |
| Fabric/silhouette accuracy | ❌ "red dress" prompt | ✅ segmentation + attribute injection |
| Platform export | ❌ manual crop | ✅ one-click 8 platforms |
| Collection workflow | ❌ single image | ✅ Kanban + bulk ops + coverage |
| Indie-brand pricing | ❌ pay-per-generation chaos | ✅ workspace flat tier |
