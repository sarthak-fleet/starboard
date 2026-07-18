# Runbook: Migrate schema

Schema changes are additive + deliberate. The migrate runner applies
`src/db/schema.sql` wholesale (every statement is `CREATE ... IF NOT EXISTS` or
idempotent), so re-running `pnpm db:migrate` is safe.

## Apply schema

```bash
pnpm db:migrate          # tsx src/db/migrate.ts
```

This runs `ensureEmbeddingDimension()` first (drops + recreates
`repo_embeddings` + vector index on dimension drift — see
[embedding-dimension-drift.md](embedding-dimension-drift.md)), then applies
`schema.sql`.

## Adding a table / index

1. Edit `src/db/schema.sql` — use `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX
   IF NOT EXISTS` so the file is re-runnable.
2. Run `pnpm db:migrate` locally against a dev Turso DB.
3. Land on `main`. The `seed-popular` / `enrich-repos` / `embed-pending` /
   `weekly-threshold-digest` workflows all run `pnpm db:migrate` first, so the
   change propagates to production on the next scheduled run.
4. For an urgent schema need, run `pnpm db:migrate` against production Turso
   manually (requires explicit approval — see
   [../../../AGENTS.md](../../../AGENTS.md) hard rules).

## Adding a column to an existing table

`schema.sql` uses `CREATE TABLE IF NOT EXISTS`, which does **not** add columns
to an existing table. For an additive column:

1. Add the column with a separate `ALTER TABLE ... ADD COLUMN` statement in
   `schema.sql` (guarded so re-running is safe — libSQL `ALTER TABLE ADD COLUMN`
   errors if the column exists; wrap in application-level idempotency in
   `migrate.ts` if needed).
2. Default the column so existing rows backfill automatically.
3. Test the migrate run locally before landing.

There is no migration history table — `schema.sql` is the canonical schema and
`migrate.ts` is the runner. This is a deliberate trade-off (see
[../../architecture/decisions/0004-turso-f32-blob-vectors.md](../../architecture/decisions/0004-turso-f32-blob-vectors.md)
context).

## Do not

- Do not hand-edit the Turso table directly. The migrate path is the only safe
  one.
- Do not change `EMBEDDING_DIM` without updating all three pinned files — see
  [embedding-dimension-drift.md](embedding-dimension-drift.md).
