# ADR-0002 — NextAuth v5 beta vs better-auth / Clerk for CF Workers

**Date:** 2026-04-25
**Status:** Active

## Context

Auth needs to run on CF Workers (Edge runtime, no Node `crypto` or filesystem
APIs). NextAuth v5 beta targets the Edge App Router pattern. better-auth and
Clerk are alternatives with edge support.

## Decision

NextAuth v5 beta with GitHub OAuth provider, `trustHost: true` hardcoded
(env-driven `AUTH_TRUST_HOST` was unreliable in the Worker), GitHub user ID
stored as the PK in the `users` table, access token threaded through JWT and
session callbacks for use in star sync.

## Rationale

NextAuth v5 was already wired before the CF migration, keeping the diff small.
It works on CF Workers with `trustHost` and the `nodejs_compat` Workers flag.
The `read:user` scope is the minimal scope needed.

## Alternatives considered

- Clerk: fully managed, strong edge support, but adds a paid third-party auth
  dependency and vendor lock-in.
- better-auth: newer, lighter, strong edge support; TBD: capture rationale for
  not switching post-migration.

## Tradeoffs

NextAuth v5 is beta; session/token shape differs from v4. `AUTH_URL` and
`NEXTAUTH_URL` must both be set in `wrangler.jsonc` vars for cookie domain and
redirect resolution to work in the Worker.

## See also

- [../../knowledge/learnings.md](../../knowledge/learnings.md) — `trustHost`
  and `AUTH_URL`/`NEXTAUTH_URL` lessons.
