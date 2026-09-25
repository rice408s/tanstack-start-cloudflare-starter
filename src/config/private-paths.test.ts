import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isPrivatePath,
  privatePathSegments,
  robotsDisallowLines,
} from './private-paths'

const ROUTES = join(__dirname, '..', 'routes')

// First URL segment of a route file, pathless `_group` dirs removed.
function firstSegment(file: string): string {
  const seg = file.replace(/\.tsx?$/, '').split(/[/.]/)[0]
  return seg === 'index' ? '' : seg
}

describe('private paths', () => {
  it('cover every route outside the marketing group', () => {
    const top = readdirSync(ROUTES, { withFileTypes: true }).flatMap((e) => {
      if (e.name.startsWith('__') || e.name.endsWith('.gen.ts')) return []
      if (e.isDirectory() && e.name.startsWith('_')) {
        if (e.name === '_marketing') return []
        return readdirSync(join(ROUTES, e.name)).map(firstSegment)
      }
      if (e.isFile() && e.name.startsWith('_')) return []
      return [firstSegment(e.name)]
    })
    for (const seg of new Set(top)) {
      expect(privatePathSegments).toContain(seg)
    }
  })

  it('match on segment boundaries only', () => {
    expect(isPrivatePath('/dashboard')).toBe(true)
    expect(isPrivatePath('/zh/admin/users')).toBe(true)
    // Only core segments here: a feature's (affiliate's `/r`) goes away with
    // its deletion recipe, and this test must survive every one.
    expect(isPrivatePath('/api/auth/session')).toBe(true)
    expect(isPrivatePath('/api-keys')).toBe(true)
    expect(isPrivatePath('/roadmap')).toBe(false)
    expect(isPrivatePath('/zh/pricing')).toBe(false)
    expect(isPrivatePath('/')).toBe(false)
  })

  it('emit exact and subtree robots rules for both locales', () => {
    const lines = robotsDisallowLines()
    expect(lines).toContain('Disallow: /api$')
    expect(lines).toContain('Disallow: /api/')
    expect(lines).toContain('Disallow: /zh/api-keys$')
    // A bare prefix line would also block /api-keys-guide, /apiary, …
    expect(lines).not.toContain('Disallow: /api')
  })
})
