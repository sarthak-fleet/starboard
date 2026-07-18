# Runbook: Rotate secrets

Rotate Cloudflare / Turso / GitHub OAuth / Resend secrets. Never commit secrets
to the repo — all secrets are gitignored or stored as Cloudflare/GitHub
Actions secrets.

## Cloudflare Worker secrets

List current secrets:

```bash
wrangler secret list
```

Rotate one:

```bash
wrangler secret put AUTH_SECRET
wrangler secret put AUTH_GITHUB_SECRET
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put RAG_SERVICE_KEY
```

After rotating `AUTH_SECRET`, existing NextAuth sessions are invalidated — users
must re-authenticate.

## Turso

```bash
turso db tokens create starboard    # new token
turso db tokens invalidate starboard # optional: invalidate old tokens
wrangler secret put TURSO_AUTH_TOKEN  # update the Worker
```

Also update the GitHub Actions repo secret `TURSO_AUTH_TOKEN` (Settings →
Secrets and variables → Actions) so scheduled jobs keep working.

## GitHub OAuth app

GitHub Developer Settings → OAuth Apps → Starboard → generate a new client
secret. Update:

- `wrangler secret put AUTH_GITHUB_SECRET`
- GitHub Actions repo secret `AUTH_GITHUB_SECRET` (only if a workflow uses it —
  the deploy workflow does not).

## Resend (weekly digest email)

Rotate `RESEND_API_KEY` in the Resend dashboard, then update the GitHub Actions
repo secret `RESEND_API_KEY`. The digest workflow is fail-closed: if the secret
is missing or invalid, email delivery is skipped with a log and the GitHub
issue is still created.

## After rotation

- Smoke: `curl --fail https://starboard.codevetter.com/` and sign in once.
- Trigger `seed-popular` manually to confirm Turso + AI gateway secrets are
  valid.
