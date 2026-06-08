# Project Recommendation Context

Generated: 2026-06-06T21:14:19.624Z

This file is a CodeVetter Repo Unpacked-inspired audit written for Starboard recommendations. It is intentionally local, evidence-oriented, and safe to commit: it records product context, feature areas, stack inventory, and recommendation guidance without secrets or environment values.

## Project Identity

- Slug: `starboard`
- Registry description: AI-built project management and dashboard system.
- Product grouping: `public-ready`
- Source path: `starboard`

## Product Context

AI-built project management and dashboard system.

Starboard organizes, searches, and rediscovers a user's GitHub starred repositories. The active product is a searchable personal knowledge base with tags, collections, semantic search, filters, public share pages, and fleet-aware repository recommendations for current SaaS Maker projects.

Starboard ! 100% AI https://img.shields.io/badge/Built%20with-100%25%20AI-blueviolet?style=for-the-badge https://claude.ai ! Live https://img.shields.io/badge/Live-starboard.workers.dev-black?style=for-the-badge https://starboard.sarthakagrawal927.workers.dev Organize, search, and rediscover GitHub starred repositories. Starboard turns a large star list into a searchable personal knowledge base with tags, lists, semantic search, fleet project recommendations, and public share pages. Live app: <https://starboard.sarthakagrawal927.workers.dev Product Shape GitHub stars are useful intent signals, but the native GitHub UI is weak for retrieval. Starboard syncs stars, enriches repository metadata

## Feature Map

- **Ingestion and sync**: External API ingestion, sync jobs, scraping, enrichment, and scheduled updates. Keywords: sync, ingest, ingestion, scrape, scraping, enrich, crawler, etl.
- **Cloudflare and deploy**: Workers, Pages, edge runtime, queues, storage, and deploy automation. Keywords: cloudflare, worker, workers, pages, edge, deploy, wrangler, queue.
- **Search and discovery**: Search, ranking, recommendations, feeds, semantic retrieval, and discovery UX. Keywords: search, discovery, recommend, ranking, semantic, feed, index, retrieval.
- **UI workflows**: Dashboards, tables, forms, component systems, charts, and user workflows. Keywords: ui, ux, dashboard, table, component, react, next, tailwind.
- **Auth and identity**: Auth, OAuth, sessions, users, permissions, and account flows. Keywords: auth, oauth, identity, session, user, permission, login, nextauth.
- **AI agents**: Agents, tool use, workflows, orchestration, RAG, evals, and model integration. Keywords: ai, agent, agents, llm, rag, embedding, eval, model.
- **Database and storage**: SQL, document storage, migrations, cache, queues, vectors, and persistence. Keywords: database, db, sql, sqlite, postgres, turso, libsql, drizzle.

## Runtime Surfaces and Entrypoints

- `src/app/.well-known/security.txt/route.ts`
- `src/app/about/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/digest/weekly/route.ts`
- `src/app/api/discover/route.ts`
- `src/app/api/embeddings/generate/route.ts`
- `src/app/api/lists/[id]/route.ts`
- `src/app/api/lists/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/radar/route.ts`
- `src/app/api/repos/[repoId]/route.ts`
- `src/app/api/stack-builder/route.ts`
- `src/app/api/stars/route.ts`
- `src/app/api/stars/sync/route.ts`
- `src/app/discover/page.tsx`
- `src/app/explore/[...slug]/page.tsx`
- `src/app/humans.txt/route.ts`
- `src/app/layout.tsx`
- `src/app/lists/[slug]/list.json/route.ts`
- `src/app/lists/[slug]/page.tsx`
- `src/app/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/projects/[slug]/page.tsx`
- `src/app/projects/page.tsx`
- `src/app/radar/page.tsx`
- `src/app/stack-builder/page.tsx`
- `src/app/stars/layout.tsx`
- `src/app/stars/page.tsx`
- `src/app/terms/page.tsx`
- `worker.mjs`

## Current Stack

- Languages: `Astro`, `TypeScript`
- Frameworks/tools: `Astro`, `Cloudflare Workers`, `Next.js`, `OpenNext Cloudflare`, `React`, `Tailwind CSS`, `Vitest`
- Config files:
- `landing-astro/astro.config.mjs`
- `landing-astro/wrangler.toml`
- `next.config.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `wrangler.jsonc`

## OSS Already In Use

Direct dependencies:
- `@fontsource-variable/geist`
- `@fontsource-variable/geist-mono`
- `@libsql/client`
- `@saas-maker/changelog-widget`
- `@saas-maker/feedback`
- `@saas-maker/sdk`
- `@saas-maker/testimonials`
- `@tanstack/react-virtual`
- `astro`
- `class-variance-authority`
- `clsx`
- `cmdk`
- `lucide-react`
- `next`
- `next-auth`
- `next-themes`
- `nuqs`
- `posthog-js`
- `radix-ui`
- `react`
- `react-dom`
- `swr`
- `tailwind-merge`

Development dependencies:
- `@opennextjs/cloudflare`
- `@saas-maker/eslint-config`
- `@saas-maker/prettier-config`
- `@saas-maker/tsconfig`
- `@tailwindcss/postcss`
- `@tailwindcss/vite`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `babel-plugin-react-compiler`
- `beasties`
- `eslint`
- `eslint-config-next`
- `husky`
- `lightningcss`
- `shadcn`
- `tailwindcss`
- `tsx`
- `tw-animate-css`
- `typescript`
- `vitest`
- `wrangler`

Package scripts:
- `astro`
- `build`
- `build:cf`
- `cf:build`
- `cf:typegen`
- `db:embed-pending`
- `db:enrich-repos`
- `db:migrate`
- `db:seed-embeddings`
- `db:seed-popular`
- `deploy:cf`
- `dev`
- `fleet:audit-recommendation-context`
- `fleet:extract-projects`
- `lint`
- `prepare`
- `preview`
- `preview:cf`
- `start`
- `test`
- `test:e2e`
- `test:e2e:mobile`
- `test:watch`
- `typecheck`
- `weekly:threshold-digest`

## Testing and Quality Signals

- `e2e/landing-mobile.spec.ts`
- `playwright.config.ts`
- `src/__tests__/embeddings.test.ts`
- `src/__tests__/fleet-projects.test.ts`
- `src/__tests__/list-sharing.test.ts`
- `src/__tests__/maintainer-digest.test.ts`
- `src/__tests__/release-radar.test.ts`
- `src/__tests__/repo-ai-metadata.test.ts`
- `src/__tests__/search-integration.test.ts`
- `src/__tests__/search.test.ts`
- `src/__tests__/stack-builder.test.ts`
- `vitest.config.ts`

## Recommendation Guidance

Good matches:
- Repos that strengthen ingestion and sync without replacing already-installed libraries.
- Repos that strengthen cloudflare and deploy without replacing already-installed libraries.
- Repos that strengthen search and discovery without replacing already-installed libraries.
- Repos that strengthen ui workflows without replacing already-installed libraries.
- Repos that strengthen auth and identity without replacing already-installed libraries.
- Repos that strengthen ai agents without replacing already-installed libraries.
- Repos that strengthen database and storage without replacing already-installed libraries.
- Tools with concrete support for src, route.ts, api, page.tsx, stars, starboard, cloudflare, embeddings.
- Implementation repos, SDKs, CLIs, testing utilities, adapters, and focused libraries are higher value than generic awesome lists.

Avoid recommending:
- Do not recommend packages already listed under direct or development dependencies unless the task is migration research.
- Do not recommend broad framework replacements unless the project context explicitly calls for a rewrite.
- Downrank curated lists, archived repos, stale demos, and generic UI kits that do not map to the feature catalog.

## Evidence Read

Primary docs and handoff files:
- `PROJECT_STATUS.md`
- `README.md`
- `agents.md`
- `docs/README.md`

Package manifests:
- `landing-astro/package.json`
- `package.json`

Inventory notes:
- Files scanned: 218
- This pass uses deterministic repo inventory plus local documentation/source-path evidence. It does not claim a full manual line-by-line review of every source file.

## Confidence

Confidence: **high**

Why:
- PROJECT_STATUS.md present
- README.md present
- 30 entrypoint/runtime files identified
- package dependencies inventoried
- 12 test/quality files identified

Refresh command:

```bash
cd /Users/sarthak/Desktop/fleet/starboard
pnpm fleet:audit-recommendation-context
pnpm fleet:extract-projects
```
