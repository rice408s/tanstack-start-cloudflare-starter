# End-to-end tests

`bun run e2e` (or `bun run e2e:ui` for the inspector). Playwright drives headless
Chromium against the **real dev server** (`bun run dev`, workerd + local D1) —
if :3000 is already serving it is reused, otherwise it is started. First run:
`bunx playwright install chromium`.

## What global setup does

1. `bun run db:migrate:local`.
2. Inserts `e2e-user@acme.test` with a 7-day session and writes its signed
   session cookie to `e2e/.auth/user.json` (a storage state). The cookie is
   `token.base64(HMAC-SHA256(BETTER_AUTH_SECRET, token))` — the scheme
   better-auth uses, with the secret read from `.dev.vars`.
3. Teardown deletes that user, its sessions and the storage state.

## Files

- `marketing.spec.ts` — landing page in en and zh, the `/zh` prefix sticking
  across navigation, header links, 404.
- `guards.spec.ts` — anonymous visitors are sent to `/login`; a signed-in user
  reaches `/dashboard` and `/settings`.
- `security-headers.spec.ts` — every response carries the headers from
  `src/core/server/security-headers.ts`.

## Conventions

- Prefer role/label locators with the English copy from `messages/en.json`.
- SSR'd marketing pages are only interactive after hydration — use the
  `open()` helper in `marketing.spec.ts` before clicking.
- Anything a test creates must be identifiable for teardown (`e2e-` prefix).
