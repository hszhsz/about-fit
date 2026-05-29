import { z } from "zod";
import { PlatformIdSchema, type PlatformId, type PlatformPreset } from "./platform";

/**
 * Canonical preset catalog. Single source of truth for sizes, formats, and
 * aspect ratios across the API, worker, and frontend.
 *
 * NOTE on sizes:
 *   - Marketplace specs change; treat these as defaults that brands can
 *     override per-workspace in M5 (settings.platforms.json).
 *   - Sizes are in pixels.
 */
export const PLATFORM_PRESETS: Record<PlatformId, PlatformPreset> = {
  "taobao-main": {
    id: "taobao-main",
    label: "淘宝主图 800×800",
    size: [800, 800],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "1:1",
  },
  "taobao-detail": {
    id: "taobao-detail",
    label: "淘宝详情 750×1000",
    size: [750, 1000],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "3:4",
  },
  "douyin-feed": {
    id: "douyin-feed",
    label: "抖音 Feed 1080×1350",
    size: [1080, 1350],
    format: "jpg",
    background: "#000000",
    aspectRatio: "4:5",
  },
  "douyin-cover": {
    id: "douyin-cover",
    label: "抖音封面 1080×1440",
    size: [1080, 1440],
    format: "jpg",
    background: "#000000",
    aspectRatio: "3:4",
  },
  "shopify-hero": {
    id: "shopify-hero",
    label: "Shopify Hero 2048×2560",
    size: [2048, 2560],
    format: "webp",
    background: "#FAFAF7",
    aspectRatio: "4:5",
  },
  "tiktok-shop": {
    id: "tiktok-shop",
    label: "TikTok Shop 1080×1080",
    size: [1080, 1080],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "1:1",
  },
  "amazon-a-plus-banner": {
    id: "amazon-a-plus-banner",
    label: "Amazon A+ Banner 970×600",
    size: [970, 600],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "97:60",
  },
  "amazon-a-plus-square": {
    id: "amazon-a-plus-square",
    label: "Amazon A+ Square 300×300",
    size: [300, 300],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "1:1",
  },
  xiaohongshu: {
    id: "xiaohongshu",
    label: "小红书 1080×1440",
    size: [1080, 1440],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "3:4",
  },
  "instagram-feed": {
    id: "instagram-feed",
    label: "Instagram Feed 1080×1080",
    size: [1080, 1080],
    format: "jpg",
    background: "#FFFFFF",
    aspectRatio: "1:1",
  },
  "instagram-story": {
    id: "instagram-story",
    label: "Instagram Story 1080×1920",
    size: [1080, 1920],
    format: "jpg",
    background: "#000000",
    aspectRatio: "9:16",
  },
};

export const PlatformPresetIdSchema = PlatformIdSchema;

export const ALL_PRESET_IDS = Object.keys(PLATFORM_PRESETS) as PlatformId[];

/**
 * Group presets by region / use-case for UI bars.
 */
export const PRESET_GROUPS: Array<{
  group: "CN-marketplaces" | "CN-social" | "Overseas-marketplaces" | "Overseas-social";
  label: string;
  ids: PlatformId[];
}> = [
  {
    group: "CN-marketplaces",
    label: "国内电商",
    ids: ["taobao-main", "taobao-detail"],
  },
  {
    group: "CN-social",
    label: "国内内容",
    ids: ["douyin-feed", "douyin-cover", "xiaohongshu"],
  },
  {
    group: "Overseas-marketplaces",
    label: "海外电商",
    ids: ["shopify-hero", "tiktok-shop", "amazon-a-plus-banner", "amazon-a-plus-square"],
  },
  {
    group: "Overseas-social",
    label: "海外内容",
    ids: ["instagram-feed", "instagram-story"],
  },
];

export function getPreset(id: PlatformId): PlatformPreset {
  const p = PLATFORM_PRESETS[id];
  if (!p) throw new Error(`Unknown platform preset: ${id}`);
  return p;
}

/**
 * Stable filename slug for an exported file: `${sku|garmentId}_${presetId}_${index}.${ext}`
 * Used by both the worker (when writing the resized file) and the zip entry name.
 */
export function presetFilename(
  baseSlug: string,
  presetId: PlatformId,
  index: number,
  format: PlatformPreset["format"],
): string {
  return `${baseSlug}_${presetId}_${String(index).padStart(2, "0")}.${format}`;
}

/** Runtime z-schema for validating user-supplied preset id lists from the API. */
export const PresetSelectionSchema = z.array(PlatformPresetIdSchema).min(1).max(11);
