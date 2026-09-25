# TanStack Start + Cloudflare starter

English | [简体中文](README.zh.md)

A free, MIT-licensed full-stack starter on **TanStack Start + Cloudflare Workers (D1 / R2)**, with passwordless auth, i18n, an MDX blog and docs, and rules that keep AI coding agents (Claude Code, Codex, Cursor) on the rails.

It is **ShipKit Lite**: [ShipKit](https://shipkit.sh) with the paid modules taken out. What is left runs on its own and is yours to keep.

## What's inside

| Layer | Choice |
|---|---|
| Framework | TanStack Start + TanStack Router / Query |
| Runtime | Cloudflare Workers (`@cloudflare/vite-plugin` — local dev runs in workerd) |
| Database | Cloudflare D1 + Drizzle (a binding, no connection string) |
| Auth | better-auth, passwordless: emailed 6-digit codes, plus Google and GitHub when their keys are set |
| Storage | R2 binding (profile photos) |
| Email | Resend — without a key, sign-in codes print to the dev log |
| i18n | Paraglide — English at `/`, Chinese at `/zh`, no locale code in routes |
| Content | MDX blog, docs and legal pages, compiled at build time |
| UI | shadcn/ui + Tailwind v4, four themes in light and dark, a landing page assembled from data |
| Quality | Biome, Vitest, Playwright, and rules-as-tests (`src/core/rules.test.ts`) |

## Quickstart

```bash
bun install
cp .dev.vars.example .dev.vars    # set BETTER_AUTH_SECRET: openssl rand -base64 32
bun run cf-typegen
bun run db:migrate:local
bun run dev                       # http://localhost:3000
```

Sign in at `/login` with an emailed code — without `RESEND_API_KEY` the code is printed in the dev server's terminal.

Full steps: [Getting started](content/docs/getting-started.mdx) · [Deploy](content/docs/deploy.mdx).

## With an AI agent

Open the repo in Claude Code and run `/setup`. `/google-oauth` wires Google sign-in, `/deploy` puts the app on Cloudflare. Project rules live in `CLAUDE.md`; `AGENTS.md` points Codex, Cursor, Copilot, Windsurf, opencode, Zed and Amp at the same rules.

## Scripts

| Script | What it does |
|---|---|
| `bun run dev` | Dev server in workerd with local D1 / R2 |
| `bun run build` / `deploy` | Production build (prerenders marketing pages) / build + `wrangler deploy` |
| `bun run db:generate` | Drizzle migration from the schema |
| `bun run db:migrate:local` / `:remote` | Apply migrations |
| `bun run auth:generate` | Regenerate better-auth tables after auth config changes |
| `bun run typecheck` / `check` | tsc / Biome |
| `bun run test` / `e2e` | Vitest / Playwright |
| `bun run cf-typegen` | Regenerate `Env` types after `wrangler.jsonc` changes |

## Need more?

[ShipKit](https://shipkit.sh) is the full version on the same architecture: Stripe and Creem payments (one-time, subscriptions, refunds), metered credits, an admin console with roles and permissions, API keys, an affiliate program, notifications and an audit log — each deletable in minutes. One-time purchase.

## License

[MIT](LICENSE)
