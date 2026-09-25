---
name: deploy
description: Deploy the app to Cloudflare Workers — provision D1/R2, apply remote migrations, push secrets, deploy, and finish post-deploy wiring (OAuth redirects, canonical URL).
---

# Deploy to Cloudflare Workers

The agent runs every command and edits every file; the user only supplies
production values and confirms billing-sensitive actions.

## 0. Preconditions

```bash
bunx wrangler whoami   # if not logged in: have the user run `! wrangler login`
```

Confirm the production domain with the user before starting — it appears in
three places (APP_URL secret, OAuth redirect URIs, appConfig.url).

## 1. Provision (idempotent — skip what exists)

The project's name lives in three lines of `wrangler.jsonc` — `name` (the
Worker), `database_name` and `bucket_name` — plus `name` in `package.json`.
If they still say `my-app`, ask the user what to call the project and change
them first; every script addresses the database by its binding (`DB`), so
nothing else needs to follow.

```bash
bunx wrangler d1 create <database_name>
```

Copy the returned `database_id` into `wrangler.jsonc` (replacing the
placeholder), then:

```bash
bunx wrangler r2 bucket create <bucket_name>
bun run cf-typegen
bun run db:migrate:remote
```

## 2. Secrets

Required: `APP_URL` (https://<domain>), `BETTER_AUTH_SECRET` (generate a NEW
one for prod — don't reuse dev).

Optional: `RESEND_API_KEY` (without it no email is sent — including sign-in
codes, so production sign-in needs it or an OAuth pair),
`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` +
`GITHUB_CLIENT_SECRET` (each pair both or neither).

```bash
echo "<value>" | bunx wrangler secret put APP_URL
# …repeat per secret. Never echo secret values into the chat transcript;
# read them from .dev.vars where appropriate, but APP_URL and
# BETTER_AUTH_SECRET must be production-specific.
```

## 3. Deploy & verify

```bash
bun run deploy
curl -s -o /dev/null -w "%{http_code}" https://<domain>/          # 200
curl -s -o /dev/null -w "%{http_code}" https://<domain>/dashboard # 307 -> /login
curl -s https://<domain>/blog | grep -c hreflang                  # 3
```

## 4. Post-deploy wiring (easy to forget)

1. Google Console: add `https://<domain>` to origins and
   `https://<domain>/api/auth/callback/google` to redirect URIs (same client).
2. GitHub sign-in, if configured: add
   `https://<domain>/api/auth/callback/github` to the OAuth app.
3. `src/config/app-config.ts`: set `url` to the production origin (drives
   hreflang) — then redeploy once.
4. Resend: verify the sending domain and set `emailFrom` in `app-config.ts`.

## Notes

- Custom domain: attach it in the Cloudflare dashboard (Workers → settings →
  Domains & Routes); `workers.dev` URL works immediately for smoke tests but
  Google OAuth needs whichever origin users actually visit.
- Subsequent deploys are just `bun run deploy` (+ `db:migrate:remote` when
  there are new migrations — always migrate BEFORE deploying code that needs
  the new schema).
