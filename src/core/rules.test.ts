import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// The rules in CLAUDE.md that matter most, as tests. Written guidance is
// followed most of the time; these make the rest of the time a failed test
// instead of a bug in production. When a rule changes, change it in both.

const SRC = join(import.meta.dirname, '..')

function sourceFiles(dir = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Generated or test-only code is not held to the app's rules.
      return ['paraglide', 'test'].includes(entry.name) ? [] : sourceFiles(path)
    }
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : []
  })
}

const files = sourceFiles().map((path) => ({
  path: relative(SRC, path),
  code: readFileSync(path, 'utf8'),
}))
const read = (path: string) => files.find((f) => f.path === path)?.code ?? ''

describe('project rules', () => {
  it('finds the source files', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  // Rule 1. Anywhere else it can reach the client bundle and break it.
  it('imports cloudflare:workers only in core/server/cf.ts', () => {
    const offenders = files
      .filter((f) => /from ['"]cloudflare:workers['"]/.test(f.code))
      .map((f) => f.path)
    expect(offenders).toEqual(['core/server/cf.ts'])
  })

  // Rule 3. A server function built anywhere else can forget the session
  // check; the deliberately public ones are named here, so adding one is a
  // visible decision rather than an accident.
  it('builds server functions only from authedFn, bar the named public ones', () => {
    const PUBLIC = ['getAuthProvidersFn', 'getSessionFn']
    const raw = files.flatMap((f) =>
      f.path === 'core/server/fn.ts'
        ? []
        : [...f.code.matchAll(/export const (\w+) = createServerFn\(/g)].map(
            (m) => `${f.path}: ${m[1]}`,
          ),
    )
    expect(raw.filter((r) => !PUBLIC.some((name) => r.endsWith(name)))).toEqual(
      [],
    )
  })

  // Rule 5. The barrel is what Drizzle and the migrations see.
  it('exports every feature schema from core/db/schema.ts', () => {
    const barrel = read('core/db/schema.ts')
    const missing = files
      .filter((f) => /^features\/[^/]+\/schema\.ts$/.test(f.path))
      .map((f) => `@/${f.path.replace(/\.ts$/, '')}`)
      .filter((mod) => !barrel.includes(`'${mod}'`))
    expect(missing).toEqual([])
  })
})

describe('core/server/fn.ts stays client-safe', () => {
  // It is bundled for the client too (a server function leaves a stub
  // there) and the build strips only what a `.server()` callback
  // references. A plain helper that reaches the database drags
  // cloudflare:workers into the browser, and the build then fails naming an
  // unrelated file.
  const source = read('core/server/fn.ts')

  it('exports no plain functions', () => {
    const exported = [...source.matchAll(/^export (?:async )?function (\w+)/gm)]
    expect(exported.map((m) => m[1])).toEqual([])
  })

  it('touches the database only inside .server() callbacks', () => {
    const beforeFirstServer = source.slice(0, source.indexOf('.server('))
    expect(beforeFirstServer).not.toMatch(/getDb\(/)
  })
})
