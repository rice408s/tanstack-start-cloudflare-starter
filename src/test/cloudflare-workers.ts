// Stand-in for `cloudflare:workers` under vitest (aliased in vitest.config.ts).
// The real module only exists inside workerd; tests that reach the database
// fill `env` with a Miniflare D1 and the secrets they need (see ./d1.ts).
export const env: Record<string, unknown> = {}
