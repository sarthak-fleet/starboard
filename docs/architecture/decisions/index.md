# Architecture Decisions

One file per decision, numbered in the order they were recorded (oldest first).
Each ADR follows the Context / Decision / Rationale / Alternatives / Tradeoffs
shape. Status is `Active` unless superseded — superseded ADRs stay in place with
a `Status: Superseded` line and a pointer to the replacement.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-deploy-vercel-to-cloudflare-workers.md) | Deployment: Vercel → Cloudflare Workers via OpenNext | Active |
| [0002](0002-nextauth-v5-beta.md) | NextAuth v5 beta vs better-auth / Clerk for CF Workers | Active |
| [0003](0003-opennext-libsql-bundling.md) | OpenNext + @libsql bundling workaround | Active |
| [0004](0004-turso-f32-blob-vectors.md) | Turso (libSQL) with F32_BLOB vectors vs pgvector / Pinecone / Qdrant | Active |
| [0005](0005-cf-workers-ai-binding-vs-http-gateway.md) | CF Workers AI binding vs HTTP AI Gateway for embeddings | Active |
| [0006](0006-embedding-dimension-contract.md) | Embedding dimension contract: 768d BGE, enforced at migrate time | Active |
| [0007](0007-similar-repos-reranking.md) | Similar-repos reranking: cosine base + topic/language/word boosts | Active |
| [0008](0008-hybrid-rrf-search.md) | Hybrid RRF search vs pure vector or pure lexical | Active |

Pre-split history: these ADRs were originally authored in a single
`docs/archive/decisions.md` file (newest first, ADR-008 → ADR-001). That file was
split into the per-decision files above on 2026-07-18; the original is preserved
in git history.
