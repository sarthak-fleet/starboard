# Archive

Historical records preserved verbatim (with a dated historical marker where
needed). These describe decisions, lessons, plans, and audits that were
authoritative at a point in time. Current truth lives in the rest of `docs/`.

When archiving a superseded doc, move it here with `git mv`, give it a dated
filename, and prepend a one-line historical marker pointing at the current
canonical doc.

## Pre-split ADRs

The eight ADRs now live as individual files in
[../architecture/decisions/](../architecture/decisions/). They were originally
authored in a single `docs/archive/decisions.md` (newest first), split on
2026-07-18. The original is preserved in git history.

## Migration history

- [`retro-2026-04-25-vercel-to-cloudflare.md`](retro-2026-04-25-vercel-to-cloudflare.md)
  — Retro for the Vercel → Cloudflare Workers migration (hosting, embeddings,
  auth, bundling). Current decisions live in
  [../architecture/decisions/](../architecture/decisions/).

## Plans (shipped)

- [`plans-2026-02-22-starboard-design.md`](plans-2026-02-22-starboard-design.md)
  — Original Starboard design document (Next.js 14 + Vercel Postgres + Drizzle).
  The stack has since moved to Next.js 16 + Turso + raw SQL + Cloudflare
  Workers; preserved for the original product shape and data model intent.
- [`plans-2026-06-12-hybrid-ranking-eval-harness.md`](plans-2026-06-12-hybrid-ranking-eval-harness.md)
  — Hybrid ranking eval harness PRD (shipped 2026-06-13). Implementation:
  `src/lib/recommendation-eval.ts`.
- [`plans-2026-06-12-weekly-repository-alerts.md`](plans-2026-06-12-weekly-repository-alerts.md)
  — Weekly repository alerts PRD (shipped 2026-06-13). Implementation:
  `src/lib/alert-preferences.ts`, `src/lib/weekly-alerts.ts`, `/api/alerts/*`.
- [`plans-2026-06-12-shareable-insight-reports.md`](plans-2026-06-12-shareable-insight-reports.md)
  — Shareable insight reports PRD (shipped 2026-06-13). Implementation:
  `src/lib/insight-reports.ts`, `POST /api/reports`, `/reports/[slug]`.

## Evaluations & context

- [`oss-integration-evaluation.md`](oss-integration-evaluation.md) — OSS search
  / vector store integration evaluation (Orama, LanceDB, Tantivy, ort, Outlines,
  RRF). Decision: do not add a new search engine; implement RRF fusion inside
  the existing scorer. Current ADRs:
  [../architecture/decisions/0008-hybrid-rrf-search.md](../architecture/decisions/0008-hybrid-rrf-search.md),
  [../architecture/decisions/0004-turso-f32-blob-vectors.md](../architecture/decisions/0004-turso-f32-blob-vectors.md).
- [`project-recommendation-context.md`](project-recommendation-context.md) —
  Fleet project recommendation context audit. Current recommendation scorer:
  `src/lib/fleet-projects.ts`.
- [`learning-new-things.md`](learning-new-things.md) — "New things to learn"
  notes captured during the CF migration. Current external references live in
  [../knowledge/external-references.md](../knowledge/external-references.md).

## Audits

- [`security-audit-2026-03-28.md`](security-audit-2026-03-28.md) — Security
  audit (paused). Action items: rotate `AUTH_SECRET`, `AUTH_GITHUB_SECRET`,
  `TURSO_AUTH_TOKEN` before resuming development; confirm old non-Cloudflare
  deployment targets are paused; keep `.env.example` documenting required vars
  (done). See [../operations/runbooks/rotate-secrets.md](../operations/runbooks/rotate-secrets.md).

## Old docs README

- [`old-docs-readme.md`](old-docs-readme.md) — the pre-consolidation
  `docs/README.md`. Superseded by [../index.md](../index.md).

## Marketing

Marketing copy iterations live in [`../marketing/`](../marketing/) (current,
not archived).
