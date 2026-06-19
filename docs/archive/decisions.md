# Architecture Decision Records

Starboard engineering decisions, newest first.

---

## ADR-008 — Hybrid RRF search vs pure vector or pure lexical

**Date:** 2026-04-25  
**Status:** Active

**Context:** Users query with short phrases ("langchain alternatives", "Rust HTTP"). Pure lexical FTS5 misses semantically-related repos with different phrasing. Pure vector search surfaces irrelevant results when users type exact repo names. Neither alone was satisfying.

**Decision:** Hybrid search combining FTS5 BM25 lexical over `repos_fts` / `repo_ai_metadata_fts` with vector ANN over `idx_repo_embeddings_vec`, fused via Reciprocal Rank Fusion (RRF, k=60).

**Rationale:** RRF is parameter-light, scale-invariant across differently-distributed score lists, and requires no learned weights. It was used in the original Cormack & Clarke paper and is recommended in both Elasticsearch and LanceDB hybrid search docs. Lexical search is only fused when `sort=relevance`; otherwise the vector path is skipped to save latency and cost.

**Alternatives considered:**
- Pure vector: no exact-match guarantee; slow for sparse models on short names.
- Linear score combination: requires tuned weights; fragile across query types.
- Re-ranking with a cross-encoder (ort): Workers-incompatible ONNX runtime; parked per `docs/oss-integration-evaluation.md`.

**Tradeoffs:** Semantic path is skipped when `sort ≠ relevance`, so embedding coverage gaps only affect opt-in queries. `VEC_DIST_MAX=0.55` cosine distance cutoff prunes noisy tail results; the threshold was set empirically and may need revisiting as the corpus grows.

---

## ADR-007 — Similar-repos reranking: cosine base + topic/language/word boosts

**Date:** 2026-04-25  
**Status:** Active

**Context:** `vector_top_k` returns candidates by ANN distance. Two repos at cosine distance 0.30 can still differ strongly in language and topic overlap, making the raw ANN order feel arbitrary.

**Decision:** Post-ANN rerank by `score = (1 - cosine_dist) + topicBoost + languageBoost + wordBoost`. Topic boost is capped at 0.14 (4 shared topics × 0.035). Language boost is 0.03. Word boost is capped at 0.04.

**Rationale:** Light heuristic re-rank is cheap and exploits structured metadata the embedding model partially ignores. Cosine similarity stays primary so semantic drift cannot dominate.

**Alternatives considered:** Cross-encoder rerank (cost + Workers-incompatible), pure cosine (monotone, misses obvious metadata signals).

**Tradeoffs:** Boosts are hard-coded; a fixture-backed eval harness (`src/lib/recommendation-eval.ts`) now exists to validate ranking before adjusting weights.

---

## ADR-006 — Embedding dimension contract: 768d BGE, enforced at migrate time

**Date:** 2026-04-11 (initial); 2026-05-16 (self-heal added)  
**Status:** Active

**Context:** `libsql_vector_idx` is dimension-pinned. Inserting a vector of the wrong length fails silently or throws "vector dimensions different: N != M". Early deploys hit this after the embedding gateway occasionally returned doubled-dimension responses.

**Decision:** Three files pin `EMBEDDING_DIM=768` together: `src/lib/embeddings.ts` (constant + runtime assertion), `src/db/schema.sql` (`F32_BLOB(768)` column + index DDL), and `src/db/migrate.ts` (`ensureEmbeddingDimension()` parses `PRAGMA table_info` to detect drift and drops + recreates the table before running schema). The seed workflow runs `db:migrate` first, so dimension self-heal fires on every CI run.

**Rationale:** The migration-time check means no manual DB surgery is needed if the model changes. The assert in `generateEmbeddings()` surfaces a clear error message instead of silent vector truncation.

**Alternatives considered:** Migration guard only (no runtime assert) — silently inserts wrong vectors. Runtime assert only (no schema drop) — migration succeeds but inserts fail.

**Tradeoffs:** A model change triggers a full table drop + re-embed (up to `SEED_DAILY_LIMIT` per day until the pool fills). The `normalizeEmbeddingDimensions()` helper in `embeddings.ts` handles the edge case where an API gateway doubles the dimension by averaging pairs, but that is a last resort, not the normal path.

---

## ADR-005 — CF Workers AI binding vs HTTP AI Gateway for embeddings

**Date:** 2026-04-25  
**Status:** Active

**Context:** Two environments need embeddings: the deployed Worker (request-time semantic search) and GitHub Actions scripts (`seed-popular.ts`, `seed-embeddings.ts`) running in Node. The Workers AI binding is not available in Node; the HTTP AI Gateway is available everywhere but adds network latency in the Worker.

**Decision:** `generateEmbeddings()` in `src/lib/embeddings.ts` checks for the CF Workers AI binding via `getCloudflareContext()` at runtime. If the binding is present, it calls `ai.run()` directly (zero HTTP hop). If not, it falls back to `embedViaHttp()` which calls `AI_GATEWAY_URL`. Both paths call the same model (`@cf/baai/bge-base-en-v1.5`) so vectors are identical. The `BATCH_SIZE=50` limit applies to both paths to stay inside Workers AI per-request limits.

**Rationale:** The binding path avoids the `AI_GATEWAY_URL`/`AI_GATEWAY_API_KEY` env vars in production (one fewer secret). It also removes one HTTPS round-trip per search query in the hot path.

**Alternatives considered:**
- HTTP-only (Vercel AI SDK-style): simpler code, but adds latency and a secret in production.
- Binding-only: breaks the seed GH Actions scripts that run in Node.

**Tradeoffs:** `getCloudflareContext()` throws in Node; the try/catch in `getAiBinding()` makes it return `null` gracefully. If the binding is misconfigured in wrangler but the env vars are set, the HTTP fallback silently takes over.

---

## ADR-004 — Turso (libSQL) with F32_BLOB vectors vs pgvector / Pinecone / Qdrant

**Date:** 2026-04-11  
**Status:** Active

**Context:** Starboard needed both relational data (users, repos, lists, tags) and vector similarity search. Three options: add a separate vector DB alongside a relational store; migrate to Postgres + pgvector; use Turso's native `F32_BLOB` / `libsql_vector_idx` that landed in libSQL 0.4.

**Decision:** Turso with `F32_BLOB(768)` column and `libsql_vector_idx(embedding, 'metric=cosine')` index. No separate vector store.

**Rationale:** Single database for all data eliminates a round-trip join between relational and vector results. Turso is already the persistence layer (no new ops surface). `libsql_vector_idx` exposes ANN search through the same SQL interface as the rest of the schema. Free tier covers the current corpus size.

**Alternatives considered:**
- pgvector (Neon/Supabase): strong ecosystem, but requires migrating off Turso entirely and adds a Postgres operational surface.
- Pinecone / Qdrant: strong managed ANN at scale, but breaks the single-DB model and adds a second paid service.

**Tradeoffs:** `libsql_vector_idx` is relatively new and has rough edges (dimension-pinned, `vector_top_k` is global not filtered). The user-scope filter in semantic search is applied in the `WHERE` clause after ANN, not inside the index, so `VEC_TOP_K=500` candidate rows are fetched before user-filtering. This is acceptable at current corpus size but will need revisiting if the seeded pool exceeds ~100k repos.

---

## ADR-003 — OpenNext + @libsql bundling workaround

**Date:** 2026-04-25  
**Status:** Active

**Context:** OpenNext 1.19 for Cloudflare did not honor Next.js `transpilePackages` for `@libsql/client`. The package ships a `workerd` export condition pointing to a CF-compatible build, but OpenNext externalised the package rather than bundling it, causing a runtime module-not-found in workerd. Several approaches failed before a stable path was found.

**Decision:**
1. `src/db/index.ts` imports from `@libsql/client/web` (the subpath that skips native Node bindings) so webpack picks the correct entry.
2. `next.config.ts` adds `transpilePackages: ["@libsql/client"]` to force the package into the bundle.
3. The CF build script uses `--webpack` (not Turbopack) because opennext-cloudflare 1.19 does not fully bundle externalized packages with Turbopack output.
4. `db/index.ts` uses a lazy-init proxy so the client is not constructed at module load time (fixes CI build failures where env vars are absent).

**Rationale:** Each mitigation addressed a specific failure mode documented in the git log and agents.md memory context. `@libsql/client/web` is the correct import for non-Node runtimes; the `transpilePackages` entry ensures webpack processes it rather than treating it as an external.

**Alternatives considered:** `useWorkerdCondition: true` in OpenNext config (tried, had no effect); webpack externals override (tried, caused native sqlite3 import failures); full switch to Cloudflare D1 (evaluated, rejected — Turso is already provisioned, D1 has different limits, and migration is a large blast radius).

**Tradeoffs:** Forces the webpack build path for the CF bundle, losing potential Turbopack incremental-build speed. Must keep `@libsql/client/web` import; using the default `@libsql/client` entry will re-break the Worker.

---

## ADR-002 — NextAuth v5 beta vs better-auth / Clerk for CF Workers

**Date:** 2026-04-25  
**Status:** Active

**Context:** Auth needs to run on CF Workers (Edge runtime, no Node `crypto` or filesystem APIs). NextAuth v5 beta targets the Edge App Router pattern. better-auth and Clerk are alternatives with edge support.

**Decision:** NextAuth v5 beta with GitHub OAuth provider, `trustHost: true` hardcoded (env-driven `AUTH_TRUST_HOST` was unreliable in the Worker), GitHub user ID stored as the PK in the `users` table, access token threaded through JWT and session callbacks for use in star sync.

**Rationale:** NextAuth v5 was already wired before the CF migration, keeping the diff small. It works on CF Workers with `trustHost` and the `nodejs_compat` Workers flag. The `read:user` scope is the minimal scope needed.

**Alternatives considered:**
- Clerk: fully managed, strong edge support, but adds a paid third-party auth dependency and vendor lock-in.
- better-auth: newer, lighter, strong edge support; TBD: capture rationale for not switching post-migration.

**Tradeoffs:** NextAuth v5 is beta; session/token shape differs from v4. `AUTH_URL` and `NEXTAUTH_URL` must both be set in `wrangler.jsonc` vars for cookie domain and redirect resolution to work in the Worker.

---

## ADR-001 — Deployment: Vercel → Cloudflare Workers via OpenNext

**Date:** 2026-04-25 (Workers); 2026-04-25 (Pages brief detour); 2026-04-28 (back to Workers)  
**Status:** Active

**Context:** Starboard was initially deployed on Vercel. A batch DB write timeout in the sync route (`fix: batch all DB writes in sync to avoid Vercel timeout`, pre-migration) was a pain point. The CF Workers AI binding (free embeddings, zero HTTP hop) and the desire to run everything in one provider motivated the move.

**Decision:** Deploy via `@opennextjs/cloudflare` to a Cloudflare Worker named `starboard`. The app bundles to ~1.33 MB gzip, inside the 3 MB free-tier Worker cap. A brief one-day detour through CF Pages (`ci: migrate deploy from CF Workers to CF Pages`, 2026-04-25) was reverted (`ci: rewrite workflow for Workers deploy`, 2026-04-28) because the Pages pattern for opennext was broken for this app.

**Rationale:** CF Workers gives access to the AI binding (free embeddings), a single deployment target for the Next.js app and embedding inference, and avoids Vercel cold-start / timeout behavior on long-running sync routes. `nodejs_compat` Workers flag provides the Node API surface needed by NextAuth and libsql.

**Alternatives considered:** CF Pages (tried, reverted — deploy workflow was broken for opennext); stay on Vercel + separate Workers AI HTTP calls (adds latency, extra secrets, no bundling wins).

**Tradeoffs:** The opennext build must use `--webpack` not Turbopack. Static asset CDN is wrangler `assets` binding. `open-next.config.ts` uses `staticAssetsIncrementalCache` so prerendered HTML (with Beasties-inlined critical CSS) is served from the assets binding instead of being re-rendered at request time — without this, the CSS inlining is discarded.
