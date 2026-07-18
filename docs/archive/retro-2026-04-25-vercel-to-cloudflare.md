# Retro: Vercel → Cloudflare Workers migration

**Date:** 2026-04-25 (migration landed) / 2026-04-28 (Workers path stabilized)  
**Scope:** Full deployment platform move — hosting, embeddings, auth, bundling.

---

## What happened

The app started on Vercel. A `fix: batch all DB writes in sync to avoid Vercel timeout` commit just before the migration shows an existing pain point: Vercel's 10-second serverless timeout was squeezing the GitHub star sync route.

On 2026-04-25, a single commit (`178a2be chore(cf): migrate from Vercel to Cloudflare Workers via opennext`) landed the full migration: wrangler.jsonc, open-next.config.ts, opennext cloudflare package, AI binding wiring, `@libsql/client/web` import fix, auth `trustHost`, and CF build scripts.

The same day, a detour through CF Pages (`77951f5 ci: migrate deploy from CF Workers to CF Pages`) was attempted and immediately broke. It was reverted three days later (`0170b8b ci: rewrite workflow for Workers deploy`, 2026-04-28).

Between migration and stabilization, several hot-fixes landed:
- `fix(db): lazy-init libsql client to fix CI build` — module-load env var crash.
- `fix(auth): set AUTH_URL/NEXTAUTH_URL vars` — OAuth callback failures.
- `Fix runtime shim and embedding dimensions` (2026-05-16) — dim mismatch.
- `Normalize gateway embedding dimensions` (2026-05-23) — doubled-dim HTTP path.
- `Fix seed workflow auth and embedding dimensions` (2026-05-23) — CI seed Action.

---

## What went well

- The core migration (Worker bundle, AI binding, libsql) landed in one commit and was live the same day.
- Bundle size (~1.33 MB gzip) fit inside the 3 MB free-tier Workers cap without optimization work.
- The dual-path embedding design (binding for Workers, HTTP for Node CLI) was wired in the same commit and has been stable since.
- The CF Workers AI binding eliminated the AI Gateway HTTP hop in the production search path.

## What was painful

- **@libsql/client bundling** required three separate mitigations (`/web` subpath, `transpilePackages`, `--webpack` build). None alone was sufficient; the sequence required debugging dead ends including `useWorkerdCondition`, webpack externals, and native binary failures.
- **CF Pages detour** cost a day and left a broken workflow in CI for three days.
- **Auth trustHost** — the env-driven flag not working in the Worker was a non-obvious failure; required code-level hardcoding.
- **Embedding dimension bugs** took two separate fix commits weeks after the migration (2026-05-16 and 2026-05-23), suggesting the dimension contract was not yet fully understood at migration time.

## What to do differently next time

- Validate `@libsql/client` (or any package with native bindings) in a minimal Worker bundle before committing to a full app migration.
- Test the CF Pages pattern against a trivial opennext app before adopting it for a production app — the pattern was broken and the Workers pattern is the right one.
- Add a dimension-mismatch integration test to CI that catches doubled-dim responses from the HTTP gateway before they reach production.
- Set `AUTH_URL` and `NEXTAUTH_URL` and hardcode `trustHost` as step 1 of any NextAuth-on-Workers setup, not as a post-deploy hotfix.
