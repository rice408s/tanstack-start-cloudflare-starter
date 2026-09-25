import type { MDXContent } from 'mdx/types'
import type { z } from 'zod'
import { isLocale, type Locale } from '@/paraglide/runtime'
import type { Heading } from './remark-headings'

// MDX files are compiled to ES modules at build time (vite @mdx-js/rollup).
// import.meta.glob collects them; zod validates frontmatter on first import,
// so a bad frontmatter fails the build/dev server, not a visitor.
//
// File naming: `slug.mdx` (locale-neutral) or `slug.<locale>.mdx`
// (e.g. terms.en.mdx / terms.zh.mdx). Use pickLocalized() to resolve.
//
// Every collection is TWO globs over the same files, and both must be
// literal at the call site (Vite rewrites them at build time):
//
//   import.meta.glob('/content/x/*.mdx', { query: '?meta', import: 'default', eager: true })
//   import.meta.glob<MdxModule>('/content/x/*.mdx')
//
// The first is the frontmatter alone (core/content/mdx-meta-plugin.ts) and is
// cheap enough to load everywhere; the second is the page body, one lazy
// chunk per file. Reading the frontmatter off the compiled module instead
// puts every body in the main bundle.

export interface MdxModule {
  default: MDXContent
  frontmatter: unknown
  /** `##`/`###` headings with their anchor ids (core/content/remark-headings.ts). */
  headings?: Heading[]
}

/**
 * The promise `load()` hands out, carrying the fields React's `use()` checks
 * (`status`/`value`/`reason`) so that once it has settled it is read
 * synchronously instead of suspending. Internal: callers see a plain Promise.
 */
type Tracked = Promise<MdxModule> & {
  status?: 'pending' | 'fulfilled' | 'rejected'
  value?: MdxModule
  reason?: unknown
}

export type MdxEntry<T> = T & {
  slug: string
  locale: Locale | undefined
  /**
   * The compiled page, fetched once. Call it in the route's loader so the
   * chunk is in before the page renders — MDXContent reads the same promise,
   * and a settled one renders without suspending.
   */
  load: () => Promise<MdxModule>
}

function once(importer: () => Promise<MdxModule>): () => Promise<MdxModule> {
  let promise: Tracked | undefined
  return () => {
    if (!promise) {
      const p: Tracked = importer()
      p.status = 'pending'
      p.then(
        (value) => {
          p.status = 'fulfilled'
          p.value = value
        },
        (reason) => {
          p.status = 'rejected'
          p.reason = reason
        },
      )
      promise = p
    }
    return promise
  }
}

export function collect<T>(
  meta: Record<string, unknown>,
  bodies: Record<string, () => Promise<MdxModule>>,
  schema: z.ZodType<T>,
): Array<MdxEntry<T>> {
  return Object.entries(meta).map(([key, frontmatter]) => {
    const path = key.replace(/\?meta$/, '')
    const importer = bodies[path]
    if (!importer) throw new Error(`no MDX body for ${path}`)
    const file =
      path
        .split('/')
        .pop()
        ?.replace(/\.mdx$/, '') ?? path
    const dot = file.lastIndexOf('.')
    const maybeLocale = dot === -1 ? undefined : file.slice(dot + 1)
    const locale = isLocale(maybeLocale) ? maybeLocale : undefined
    const slug = locale ? file.slice(0, dot) : file
    const data = schema.parse(frontmatter)
    return { ...data, slug, locale, load: once(importer) }
  })
}

// Exact locale first, then the locale-neutral file, then English.
export function pickLocalized<T>(
  entries: Array<MdxEntry<T>>,
  slug: string,
  locale: Locale,
): MdxEntry<T> | undefined {
  const same = entries.filter((e) => e.slug === slug)
  return (
    same.find((e) => e.locale === locale) ??
    same.find((e) => e.locale === undefined) ??
    same.find((e) => e.locale === 'en')
  )
}
