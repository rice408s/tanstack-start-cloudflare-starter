import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'
import { env } from './cloudflare-workers'

// A real D1 for tests that must prove what the SQL does — the money paths
// above all, where a conditional statement IS the business rule (D1 has no
// transactions to hide one behind). In-memory Miniflare, every migration in
// drizzle/ applied in order, so a test runs against the schema production
// has, not the one a mock remembers.
//
// Use from a test file that declares `// @vitest-environment node`.

const MIGRATIONS = join(process.cwd(), 'drizzle')

export async function startD1() {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch: () => new Response(null) }',
    d1Databases: { DB: 'test' },
    // Account erasure walks the files feature's cleanup, which lists R2.
    r2Buckets: { BUCKET: 'test' },
  })
  const db = await mf.getD1Database('DB')
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    const statements = readFileSync(join(MIGRATIONS, file), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const statement of statements) {
      await db.prepare(statement).run()
    }
  }
  // The secrets getEnv() insists on, and no provider or email keys: nothing
  // under test may reach the network.
  Object.assign(env, {
    DB: db,
    BUCKET: await mf.getR2Bucket('BUCKET'),
    APP_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test',
    GOOGLE_CLIENT_ID: 'test',
    GOOGLE_CLIENT_SECRET: 'test',
    PAYMENT_PROVIDER: 'stripe',
  })
  return { db, dispose: () => mf.dispose() }
}
