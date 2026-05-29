<div align="center">

# AboutFit

**面向服装品牌的开源 AI 营销内容工作台。**

虚拟模特 · Lookbook · 文案 · 尺码表 · 多平台导出。

简体中文 · [English](./README.md)

</div>

---

## ✨ 为什么是 AboutFit？

通用 AI 图像工具能生成"一个穿着裙子的模特"，但服装品牌真正需要的是：**整季款式上同一张脸**、版型与面料的物理合理性、以及一键导出符合淘宝 / 抖音 / Shopify / TikTok Shop 规范的成品。

AboutFit 是首个把**服装**作为一等公民的开源工具：

- 👗 **服装感知生成** — 平铺 → 上身、面料/材质控制、版型保持
- 🧍 **品牌锁定虚拟模特** — pgvector 存储脸型/体型向量，确保整季模特一致
- 📐 **尺码表生成** — 输入 tech pack，自动产出中/美/欧/日本地化尺码
- 🎬 **Lookbook 与短视频** — 系列叙事而非单图生成
- 🛒 **平台预设** — 一键导出淘宝主图 / 抖音短视频 / Shopify hero / 亚马逊 A+ 尺寸
- 🌏 **原生多语言** — zh-CN、en-US、ja 三语 UI 与内容

## 🧱 技术栈速览

Monorepo (pnpm + Turborepo) · Next.js 15 + React 19 前端 · NestJS 后端 · Postgres 16 + pgvector · Redis 7 + BullMQ · S3 兼容对象存储 · AI 适配器模式（DashScope / 即梦 / OpenAI / Replicate / ComfyUI / Fal.ai）。

完整技术栈见 [`docs/architecture.md`](./docs/architecture.md)。

## 📚 文档

| 文档 | 内容 |
|---|---|
| [品牌与 Logo](./docs/brand.md) | 品牌定位、Logo 提示词、色彩 token |
| [架构](./docs/architecture.md) | 技术栈、模块边界、数据模型 |
| [差异化壁垒](./docs/differentiation.md) | 相对通用 AI 图像工具的 5 重护城河 |
| [提示词 01 — 项目总览](./docs/prompts/01-overview.md) | 给 coding agent：要构建什么 |
| [提示词 02 — UI/UX 规范](./docs/prompts/02-ui-ux.md) | 设计语言、布局、组件 |
| [提示词 03 — 实现规划](./docs/prompts/03-implementation.md) | NestJS 模块、交付顺序、里程碑 |

## 📄 License

Apache 2.0
