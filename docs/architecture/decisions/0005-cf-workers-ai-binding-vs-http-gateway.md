# ADR-0005 — CF Workers AI binding vs HTTP AI Gateway for embeddings

**Date:** 2026-04-25
**Status:** Active

## Context

Two environments need embeddings: the deployed Worker (request-time semantic
search) and GitHub Actions scripts (`seed-popular.ts`, `seed-embeddings.ts`)
running in Node. The Workers AI binding is not available in Node; the HTTP AI
Gateway is available everywhere but adds network latency in the Worker.

## Decision

`generateEmbeddings()` in `src/lib/embeddings.ts` checks for the CF Workers AI
binding via `getCloudflareContext()` at runtime. If the binding is present, it
calls `ai.run()` directly (zero HTTP hop). If not, it falls back to
`embedViaHttp()` which calls `AI_GATEWAY_URL`. Both paths call the same model
(`@cf/baai/bge-base-en-v1.5`) so vectors are identical. The `BATCH_SIZE=50`
limit applies to both paths to stay inside Workers AI per-request limits.

## Rationale

The binding path avoids the `AI_GATEWAY_URL`/`AI_GATEWAY_API_KEY` env vars in
production (one fewer secret). It also removes one HTTPS round-trip per search
query in the hot path.

## Alternatives considered

- HTTP-only (Vercel AI SDK-style): simpler code, but adds latency and a secret
  in production.
- Binding-only: breaks the seed GH Actions scripts that run in Node.

## Tradeoffs

`getCloudflareContext()` throws in Node; the try/catch in `getAiBinding()` makes
it return `null` gracefully. If the binding is misconfigured in wrangler but the
env vars are set, the HTTP fallback silently takes over.

## See also

- [0006-embedding-dimension-contract.md](0006-embedding-dimension-contract.md)
- [../../knowledge/learnings.md](../../knowledge/learnings.md) — doubled-dimension
  HTTP gateway lesson.
