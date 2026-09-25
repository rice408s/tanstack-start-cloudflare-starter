---
name: setup
description: First-run onboarding — install deps, create .dev.vars with generated secrets, run migrations, start dev. Use right after cloning the template or when .dev.vars is missing.
---

# First-run setup

Goal: from fresh clone to a working local app with the fewest user actions.
Automate everything below.

## 1. Install & env file

```bash
bun install
bun run cf-typegen   # generates worker-configuration.d.ts (Env types, gitignored)
```

`.dev.vars` is gitignored and does not exist in a fresh clone: copy
`.dev.vars.example` over it, then fill in what can be generated:

```bash
[ -f .dev.vars ] || cp .dev.vars.example .dev.vars
# generate and insert BETTER_AUTH_SECRET yourself:
openssl rand -base64 32
```

Edit `.dev.vars` directly; it is gitignored, so never `git add -f` it.
`APP_URL` stays `http://localhost:3000` for local dev.

## 2. Sign-in methods (optional)

Only `BETTER_AUTH_SECRET` is required. Emailed-code sign-in works out of the
box: without `RESEND_API_KEY` the code is printed to the dev server log.
Google (`/google-oauth`) and GitHub buttons appear once their key pairs are
set — offer them, but don't block on them.

## 3. Database

```bash
bun run db:migrate:local
```

Local D1 lives in `.wrangler/state` — no external database, nothing to
provision.

## 4. Start & verify

```bash
bun run dev
```

Then verify (don't just trust the startup log):

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/        # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/zh/     # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard  # expect 307 -> /login
```

## 5. Next steps

- Replace the placeholders in `src/config/app-config.ts`.
- Going to production → `/deploy`.

## Known gotchas

- Port 3000 busy = a stale dev server; `pkill -f "vite dev"` first.
- If the very first build/dev fails on a vite cache from another package
  manager, `rm -rf node_modules/.vite` and retry.
- `wrangler` warns about the placeholder D1 `database_id` in wrangler.jsonc —
  harmless locally; it's replaced during `/deploy`.
