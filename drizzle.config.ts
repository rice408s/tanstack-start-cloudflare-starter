import { defineConfig } from 'drizzle-kit'

// Generate-only config: `bun run db:generate` writes SQL to ./drizzle,
// then `bun run db:migrate:local` / `db:migrate:remote` applies it via wrangler.
export default defineConfig({
  schema: './src/core/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
})
