# New things to learn — starboard

Vector search, edge deployments, and hybrid ranking patterns encountered while building a GitHub stars organizer on Cloudflare Workers.

See also: [external-references.md](external-references.md)

---

## Turso F32_BLOB vector columns (libSQL)
- What: libSQL native column type storing fixed-length float32 vectors; powers `libsql_vector_idx` ANN search without a separate vector DB.
- Why here: TBD
- Gotcha (from code): Index is dimension-pinned at creation time — inserting a vector of the wrong length throws at insert, not query time; `ensureEmbeddingDimension()` in `migrate.ts` detects drift and drops+recreates the table. Schema pin: `src/db/schema.sql:94` — `embedding F32_BLOB(768)`.
- Source: https://docs.turso.tech/features/ai-and-embeddings
- See also: [external-references.md](external-references.md)

---

## BGE-base-en-v1.5 768d embeddings
- What: `@cf/baai/bge-base-en-v1.5` — Cloudflare-hosted 768-dimension sentence embedding model trained with contrastive learning for asymmetric retrieval (queries and passages treated differently).
- Why here: TBD
- Gotcha (from code): `EMBEDDING_MODEL` and `EMBEDDING_DIM = 768` pinned together in `src/lib/embeddings.ts:13-14`; all three files in the dimension contract must change atomically when switching models (see `agents.md` "Embedding dimension contract").
- Source: https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/
- See also: [external-references.md](external-references.md)

---

## CF Workers AI binding vs HTTP AI Gateway
- What: Two paths to the same model — an in-process binding (zero HTTP hop, Workers only) and an HTTP gateway (works in Node/GH Actions too).
- Why here: TBD
- Gotcha (from code): `normalizeEmbeddingDimensions()` (`src/lib/embeddings.ts:166-179`) handles the case where the HTTP gateway returns a vector whose length is a whole multiple of `EMBEDDING_DIM`; it averages adjacent groups of `factor` values to reduce back to 768d. The 1536d→768d case (`factor=2`) is the historically observed corruption window 2026-04-11 → 2026-05-23. The binding path bypasses this entirely.
- Source: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- See also: [external-references.md](external-references.md)

---

## `vector_top_k` libsql function — global ANN only
- What: libSQL SQL function for approximate nearest-neighbor search; returns K candidates globally.
- Why here: TBD
- Gotcha (from code): The index has no predicate pushdown — `vector_top_k('idx_repo_embeddings_vec', vector(?), ?)` at `src/app/api/stars/route.ts:89` returns 500 global candidates across all users; the `WHERE ur.user_id = ?` filtering happens in the outer join at the application layer (line 80 comment confirms this). `VEC_TOP_K=500` is hardcoded at line 45 of the same file.
- Source: https://docs.turso.tech/features/ai-and-embeddings#vector-search
- See also: [external-references.md](external-references.md)

---

## OpenNext + @libsql/client bundling on CF Workers
- What: `@opennextjs/cloudflare` bundles Next.js for Workers; `@libsql/client` needs special handling to avoid native Node bindings.
- Why here: TBD
- Gotcha (from code): OpenNext 1.19 externalises `@libsql/client` regardless of `transpilePackages` — all three mitigations are required together: `/web` subpath import, `transpilePackages` entry, and `--webpack` build flag (not Turbopack). The incremental cache override is in `open-next.config.ts:12`.
- Source: https://opennext.js.org/cloudflare
- See also: [external-references.md](external-references.md)

---

## NextAuth v5 beta on CF Workers
- What: Edge-compatible auth library (beta); GitHub OAuth provider running inside a Worker.
- Why here: TBD
- Gotcha (from code): `AUTH_TRUST_HOST=true` via `wrangler.jsonc` vars was unreliable — must be hardcoded as `trustHost: true` in `NextAuth({...})` (confirmed at `src/lib/auth.ts:7`); both `AUTH_URL` and `NEXTAUTH_URL` must be set in wrangler vars.
- Source: https://authjs.dev/guides/edge-compatibility
- See also: [external-references.md](external-references.md)

---

## Cloudflare Pages vs Workers for OpenNext — Pages bounced
- What: CF Pages is an alternative deploy target to CF Workers for opennext apps.
- Why here: TBD
- Gotcha (from code): Attempted in commit `77951f5` (2026-04-25, "ci: migrate deploy from CF Workers to CF Pages"); reverted 3 days later in `0170b8b` (2026-04-28, "ci: rewrite workflow for Workers deploy (was broken Pages pattern)"). The `@opennextjs/cloudflare` static-assets incremental cache override used here (`open-next.config.ts:12`) targets the Workers binding API and does not translate cleanly to the Pages build pipeline.
- Source: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- See also: [external-references.md](external-references.md)

---

## Reciprocal Rank Fusion (RRF) for hybrid search
- What: Score-fusion algorithm that combines ranked lists from different retrievers (FTS5 BM25 + vector ANN) without needing tuned weights; `score = Σ 1/(k + rank)`, k=60.
- Why here: TBD
- Gotcha (from code): `rrfFuse()` in `src/lib/search.ts:9` implements this exactly; `k=60` is the paper's canonical default. The two input lists are lexical BM25 ids and semantic ANN ids assembled in `src/app/api/stars/route.ts:40-44`.
- Source: https://dl.acm.org/doi/10.1145/1571941.1572114 (Cormack & Clarke SIGIR 2009; plg.uwaterloo.ca URL now redirects)
- See also: [external-references.md](external-references.md)

---

## Similar-repos reranking with metadata boosts
- What: Post-ANN heuristic rerank adding topic/language/word-overlap boosts on top of cosine similarity.
- Why here: TBD
- Source: TBD (internal heuristic, no canonical external paper)
- See also: [external-references.md](external-references.md)

---

## Drizzle (considered, not used)
- What: TypeScript ORM for SQL databases with strong type inference.
- Why here: TBD
- Note: Starboard deliberately uses raw SQL via `@libsql/client` (no ORM) per `agents.md`; Drizzle was evaluated and rejected in favour of direct schema control via `src/db/schema.sql`.
- Source: https://orm.drizzle.team/
