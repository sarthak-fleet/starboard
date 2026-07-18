# ADR-0008 — Hybrid RRF search vs pure vector or pure lexical

**Date:** 2026-04-25
**Status:** Active

## Context

Users query with short phrases ("langchain alternatives", "Rust HTTP"). Pure
lexical FTS5 misses semantically-related repos with different phrasing. Pure
vector search surfaces irrelevant results when users type exact repo names.
Neither alone was satisfying.

## Decision

Hybrid search combining FTS5 BM25 lexical over `repos_fts` /
`repo_ai_metadata_fts` with vector ANN over `idx_repo_embeddings_vec`, fused via
Reciprocal Rank Fusion (RRF, k=60).

## Rationale

RRF is parameter-light, scale-invariant across differently-distributed score
lists, and requires no learned weights. It was used in the original Cormack &
Clarke paper and is recommended in both Elasticsearch and LanceDB hybrid search
docs. Lexical search is only fused when `sort=relevance`; otherwise the vector
path is skipped to save latency and cost.

## Alternatives considered

- Pure vector: no exact-match guarantee; slow for sparse models on short names.
- Linear score combination: requires tuned weights; fragile across query types.
- Re-ranking with a cross-encoder (ort): Workers-incompatible ONNX runtime;
  parked per [../../archive/oss-integration-evaluation.md](../../archive/oss-integration-evaluation.md).

## Tradeoffs

Semantic path is skipped when `sort ≠ relevance`, so embedding coverage gaps
only affect opt-in queries. `VEC_DIST_MAX=0.55` cosine distance cutoff prunes
noisy tail results; the threshold was set empirically and may need revisiting as
the corpus grows.

## See also

- [0007-similar-repos-reranking.md](0007-similar-repos-reranking.md)
- [../../knowledge/external-references.md](../../knowledge/external-references.md)
  — RRF paper and LanceDB hybrid search guide.
