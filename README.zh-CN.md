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

## 🚀 快速开始

**前置依赖：** Node ≥ 20.11、pnpm 9、Docker（含 Compose v2）。

```bash
git clone https://github.com/hszhsz/about-fit.git
cd about-fit

# 一键初始化：复制 .env、拉起 Postgres + Redis + MinIO、
# 安装依赖、执行 prisma 迁移、创建 buckets。
pnpm bootstrap

# 一键启动全部服务：
pnpm dev
# …或单独启动某个服务：
#   pnpm --filter @about-fit/api dev      # http://localhost:4000/api
#   pnpm --filter @about-fit/web dev      # http://localhost:3000
#   pnpm --filter @about-fit/worker dev
```

| 服务 | 地址 | 凭据 |
|---|---|---|
| 前端 | http://localhost:3000 | — |
| API | http://localhost:4000/api | — |
| MinIO 控制台 | http://localhost:9001 | `aboutfit` / `aboutfit-dev-secret` |

> **要跑模型？** 编辑 `.env` 填入 `DASHSCOPE_API_KEY` 后再发起渲染或文案生成。其它能力（浏览、上传、数据库）开箱即用。

### Bootstrap 变体

```bash
pnpm bootstrap          # 仅初始化（幂等，可重复运行）
pnpm bootstrap:dev      # 初始化后自动 `pnpm dev`
pnpm bootstrap:reset    # 清空 Docker 卷（Postgres/Redis/MinIO）后重建
```

### 关闭

```bash
pnpm docker:down                                       # 仅停容器，保留数据
docker compose -f infra/docker-compose.yml down -v     # 同时删除卷
```

### 里程碑进度

- ✅ **M0** — 仓库脚手架（api / web / worker / packages）
- ✅ **M1** — Garment Studio MVP（上传、虚拟模特、上身渲染 + SSE）
- ✅ **M2** — Copy Studio（标题/描述/话题，zh-CN · en-US · ja，按平台调优）
- ✅ **M3** — 多平台导出（sharp 缩放 + ZIP 打包，11 个平台预设）
- ⏳ **M4+** — 尺码表、Lookbook 视频、品牌锁定的脸/体向量

## 📄 License

Apache 2.0
