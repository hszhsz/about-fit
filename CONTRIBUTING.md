# Contributing to AboutFit

Thanks for your interest! AboutFit is an opinionated, apparel-vertical AI marketing studio. The opinion is the product — so before opening a structural PR, please read the prompt docs in `docs/prompts/` to understand the intended architecture.

## Quick links

- [Project overview](./docs/prompts/01-overview.md) — what we are building and (importantly) what we are NOT
- [UI/UX spec](./docs/prompts/02-ui-ux.md) — design language and components
- [Implementation plan](./docs/prompts/03-implementation.md) — module boundaries and milestones
- [Architecture](./docs/architecture.md) — tech stack rationale

## Ways to contribute

1. **Pick up an issue** labeled `good first issue` or `help wanted`
2. **Add a platform preset** in `packages/platform-presets/` (new e-commerce platform export specs)
3. **Add an AI provider** in `packages/ai-providers/` (single-file adapter)
4. **Translate** UI strings to a new locale (currently zh-CN, en-US, ja)
5. **Improve docs** — typos, clarifications, diagrams welcome

## Development setup

```bash
git clone https://github.com/hszhsz/about-fit.git
cd about-fit
pnpm install
docker compose -f infra/docker-compose.yml up -d  # postgres+pgvector, redis, minio
cp .env.example .env
pnpm db:migrate
pnpm dev
```

## PR checklist

- [ ] TypeScript strict passes (`pnpm typecheck`)
- [ ] Lint clean (`pnpm lint`)
- [ ] Tests added/updated (`pnpm test`)
- [ ] i18n strings added in all three locales for UI changes
- [ ] Storybook story added for new UI components
- [ ] PR description includes a screenshot / GIF for UI changes
- [ ] Conventional commit format: `feat:`, `fix:`, `docs:`, `chore:`, …

## Scope guardrails (please respect)

AboutFit is intentionally narrow:

- ✅ Apparel content generation, lookbooks, sizing, copy, multi-platform export
- ❌ Generic product photography (electronics, food, jewelry, furniture)
- ❌ Inventory / fulfillment / payment / CRM
- ❌ Live-streaming digital human
- ❌ Mobile native apps (web responsive only for now)

PRs that expand scope into the ❌ list will likely be redirected to a separate project.

## Code of Conduct

Be kind. Assume good intent. Disagreement is fine; condescension is not.

## License

By contributing you agree your contributions are licensed under Apache 2.0.
