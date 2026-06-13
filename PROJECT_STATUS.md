# Project Status

Last updated: 2026-06-13

## Current Scope

Starboard organizes, searches, and rediscovers a user's GitHub starred repositories. The active product is a searchable personal knowledge base with tags, collections, semantic search, filters, public share pages, fleet-aware repository recommendations, radar signals, weekly alerts, and shareable insight reports.

## Done

- GitHub OAuth sync is implemented through NextAuth v5.
- Cloudflare Workers deployment through OpenNext is documented.
- Turso raw SQL and Workers AI embeddings are the current persistence and semantic-search path.
- Core features include smart categories, custom tags, collections, full-text search, filters/sort, grid/list views, virtual scroll, and manual sync.
- GitHub star ingestion uses ETag caching and HTML scraping where needed.
- Scheduled Actions seed and enrich popular repositories for discovery surfaces.
- My Projects ranks the user's saved/starred repositories against each fleet project with deterministic scoring and optional embedding boosts.
- Fixture-backed recommendation eval harness compares deterministic scoring with a test-only hybrid RRF variant (`src/lib/recommendation-eval.ts`, `src/__tests__/fixtures/recommendation-eval-fixture.ts`).
- Weekly repository alerts support opt-in lanes, in-app inbox, and weekly digest payloads from existing radar/maintainer signals (`/api/alerts/*`, Radar settings UI).
- Shareable insight reports provide stable public URLs for radar, project recommendations, and cleanup snapshots (`/reports/[slug]`, `/api/reports`).
- OSS recommendation integrations were evaluated in `docs/oss-integration-evaluation.md`; no new search/vector dependency yet.
- Audit residuals and operational risks are documented.

## Planned Next

1. Stabilize scheduled Actions so seed/enrichment and digest workflows stay green.
2. Add a checked-in `.env.example` that documents required local variables without secrets.
3. Tune production recommendation scoring only after the fixture-backed benchmark stays green across scorer changes.
4. Wire weekly alert email delivery after digest payloads prove stable in production.
5. Keep sync, tag, collection, and project recommendation flows fast enough for large star libraries.

## Deferred / Parked

- Organization/team dashboards are deferred.
- General GitHub analytics beyond starred-repo rediscovery is parked.
- Provider expansion beyond GitHub is deferred.
- Real-time push notifications for alerts are deferred.
