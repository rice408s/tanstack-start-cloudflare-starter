# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Starter template (ShipKit Lite): TanStack Start (v1 RC, pinned) + Cloudflare Workers/D1/R2 + better-auth (passwordless: emailed sign-in codes, plus Google and GitHub when configured) + Paraglide i18n + MDX. Package manager is **bun**. Human docs in `README.md` and `content/docs/`.

This is a TEMPLATE, not a product. Branding is deliberately generic (`ShipKit Lite`, `example.com`, a `Your Company, Inc.` legal entity) and lives in `src/config/`. Keep it that way unless asked: changes belong in the config files, not scattered through the code.

## Commands

```bash
bun run dev                # dev server in workerd, local D1/R2 bindings (port 3000)
bun run build              # production build + prerender of marketing pages
bun run deploy             # build + wrangler deploy
bun run typecheck          # tsc --noEmit
bun run check              # biome
bun run generate-routes    # regen routeTree.gen.ts after adding/moving route files
bun run db:generate        # drizzle migration from src/core/db/schema.ts (drizzle/meta is committed and must stay in step)
bun run db:migrate:local   # apply migrations to local D1 (also :remote — run by hand before deploying)
bun run auth:generate      # regen auth tables after editing auth config (see rule 4)
bun run cf-typegen         # regen Env types after wrangler.jsonc changes
bun run test               # vitest unit tests, including the project rules (src/core/rules.test.ts)
bun run e2e                # Playwright e2e (starts/reuses dev on :3000) — run after touching routes, nav, auth guards or shell layout
bun run og                 # redraw public/og.png from scripts/og-card.html
bunx shadcn@latest add <component>   # new UI primitives — then strip shadows/ring per the design rule (`src/CLAUDE.md`); check `git diff src/components/ui`
```

## Map

- **Entry chain**: `src/server.ts` (custom Worker entry — wraps TanStack's server-entry with `paraglideMiddleware`, and runs the cron `scheduled` handler) → `src/start.ts` → `src/router.tsx` (paraglide URL `rewrite`: en unprefixed, `/zh` prefixed — no locale segment in the route tree).
- **Route groups** in `src/routes/`: `_marketing/` (public, prerendered at build — see `prerender` in `vite.config.ts`: landing, blog, docs, legal), `_auth/` (login), `_app/` (session-guarded shell: `/dashboard`, `/settings`), `api/` (server routes: the better-auth catchall and avatar streams from R2). `/blocks` (dev-only) renders every landing block shape with sample data.
- **What a route file ships to everyone**: only `component` is code-split. The rest of a route's options (`loader`, `validateSearch`, …) and every top-level side-effect import sit in the main bundle. A module with top-level side effects (`createAuthClient()`) ships whole the moment anything in the entry imports it; the Toaster is mounted lazily in `__root.tsx` for that reason.
- **`src/core/`** — shared kernel: `db/` (Drizzle client + schema barrel), `server/` (`cf.ts` bindings, `fn.ts` server-fn middleware, `rate-limit.ts`, `same-origin.ts`, `security-headers.ts` applied in `server.ts` and mirrored in `public/_headers`), `content/` (MDX loader + legal pages), `email/` (`send.ts` best-effort Resend wrapper — a logged no-op without a key; `templates/` localized by `user.locale`), `env.ts` (zod-validated). Small registries a feature plugs into with one import line in its `handlers.ts`: `account/` (account created/deleted/export hooks), `jobs/` (cron work), `audit/`, `notify/`, `analytics/` (dispatchers with no sink wired — add one when you need it).
- **`src/features/<name>/`** — vertical slices: `auth` (better-auth config, sign-in UI, account section, jobs) and `content` (blog/docs collections). Each owns its schema.ts, server/, components/.
- **`src/config/`** — `app-config.ts` (name, URLs, emails, legal entity, Google client id), `landing.ts` (the landing page), `themes.ts`, `private-paths.ts`.
- **Content**: `content/{blog,docs,legal}/*.mdx`, compiled at build time via `@mdx-js/rollup`, loaded with `import.meta.glob` + zod frontmatter in `src/features/content/collections.ts`. Every collection is TWO globs: `?meta` (frontmatter only) for lists and titles, and a lazy one for the body, fetched with `entry.load()` — never read `frontmatter` off the compiled module, that puts every body in the main bundle. No runtime-eval MDX — workerd forbids it.
- **Landing page**: assembled from data. `src/config/landing.ts` is an array of blocks; `src/routes/_marketing/index.tsx` only renders it. Block shapes are a discriminated union in `src/components/marketing/blocks/types.ts`, one component file per block, dispatched by an exhaustive switch in `render.tsx`. Every string is a THUNK (`() => m.key()`) because the module is evaluated per isolate while the locale is per request. Blocks whose own cards are `bg-surface` must stay `tone: 'plain'`. Screenshots under `public/marketing/` are committed — swap them for your own.
- **Themes**: four built-in styles — shipkit (default), editorial, soft, brutal — in `src/config/themes.ts`, each nothing but CSS custom properties (`src/styles.css`, `src/styles/themes.css`) in light and dark. `data-theme` is the STYLE, the `dark` class is the MODE. **A theme is tokens, never a branch in a component** — a look that needs a different shape needs a token (`--radius-btn`, `--radius-card`, `--font-display`, …).
- **Paraglide output** `src/paraglide/` is generated by the vite plugin from `messages/*.json`. Never run `paraglide-js compile` by hand — it ignores the vite options and breaks locale routing.
- **Secrets & local data**: `.dev.vars` (local) is gitignored, as is `.wrangler/`. `.dev.vars.example` is the key list — when you add an env var, add it there and to `src/core/env.ts`. Never commit a secret. Env is read at boot — restart the dev server after changes. `worker-configuration.d.ts` is generated — run `bun run cf-typegen` after clone or wrangler.jsonc changes.

## Hard rules

1. **`cloudflare:workers` may only be imported in `src/core/server/cf.ts`.** Anywhere else breaks the client bundle in dev. Bindings go through `getBindings()`.
2. **One data channel.** Client reads/writes go: route loader → `queryClient.ensureQueryData(query)` → server fn → Drizzle. Server fns start from `authedFn` (`src/core/server/fn.ts`) — never hand-roll session checks. **Never put a plain helper that touches the database in `core/server/fn.ts`**: it is bundled for the client and the build only strips `.server()` callbacks. Do not wrap `createServerFn` in a factory — the build cannot see through the call. API routes are only for external entries (auth, file streams, webhooks).
3. **D1 has no interactive transactions.** `db.transaction()` throws. Use a single conditional statement or `db.batch()`.
4. **Auth config changes need two files**: `src/features/auth/server/auth.ts` AND `auth.cli-config.ts` (the CLI can't resolve `cloudflare:workers`), then `bun run auth:generate` + `bun run db:generate`.
5. **Features are vertical slices** under `src/features/<name>/`. Cross-feature imports only via `core/`. A new feature exports its schema from `src/core/db/schema.ts` and plugs into core registries with one line in the matching `handlers.ts`.
6. **Design taste**: see `src/CLAUDE.md`. Short version: no colored accent (contrast does the work), pill buttons, soft radius, sans-serif only, hairline borders, near-zero shadows, no gradients/glassmorphism/emoji.
7. **Never localize in a server function.** One is reached at `/_serverFn/...`, a URL with no locale segment, so paraglide inside it resolves from the cookie or `Accept-Language`, not the page the caller is on. Server code returns keys and values; the component calls `m.*`. Outbound text (email) is localized explicitly by the recipient's `user.locale`.
8. Timestamps are `integer({ mode: 'timestamp_ms' })`. UI copy goes through Paraglide messages (`messages/{en,zh}.json`, flat keys with feature prefixes).

`src/core/rules.test.ts` enforces rules 1, 2 and 5 — `bun run test` fails when one is broken.

## Skills (setup flows — prefer these over improvising)

`AGENTS.md` mirrors this file's pointers for other agents — keep its skill table in step when a skill is added or renamed.

- `/setup` — first-run onboarding: install, secrets, DB, dev server
- `/google-oauth` — wire Google sign-in credentials (optional; emailed codes print to the dev log without `RESEND_API_KEY`)
- `/deploy` — provision D1/R2, push secrets, deploy to Cloudflare Workers

Payments, credits, an admin console with RBAC, API keys and more are in the full version, ShipKit (https://shipkit.sh).
