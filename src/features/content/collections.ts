import { z } from 'zod'
import { collect, type MdxModule, pickLocalized } from '@/core/content/mdx'
import type { Locale } from '@/paraglide/runtime'

// Post categories: how a reader wants to use the page, not what platform
// it is about. `example` is a walkthrough of one real job, `guide` a how-to,
// `specs` a platform's rules to check against. Labels live in messages.
export const postCategories = ['guide', 'specs', 'example'] as const
export type PostCategory = (typeof postCategories)[number]

const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string(),
  category: z.enum(postCategories),
  /** Marketing media key for the cover frame. */
  cover: z.string(),
})

// Docs sidebar sections, in reading order. Labels live in messages
// (`docs_group_<id>`).
export const docGroups = [
  'start',
  'concepts',
  'features',
  'customize',
  'reference',
] as const
export type DocGroup = (typeof docGroups)[number]

const docSchema = z.object({
  title: z.string(),
  description: z.string(),
  group: z.enum(docGroups),
  /** Position inside its group. */
  order: z.number().default(0),
})

export const posts = collect(
  import.meta.glob('/content/blog/*.mdx', {
    query: '?meta',
    import: 'default',
    eager: true,
  }),
  import.meta.glob<MdxModule>('/content/blog/*.mdx'),
  postSchema,
).sort((a, b) => b.date.localeCompare(a.date))

export const docs = collect(
  import.meta.glob('/content/docs/*.mdx', {
    query: '?meta',
    import: 'default',
    eager: true,
  }),
  import.meta.glob<MdxModule>('/content/docs/*.mdx'),
  docSchema,
).sort(
  (a, b) =>
    docGroups.indexOf(a.group) - docGroups.indexOf(b.group) ||
    a.order - b.order,
)

export const postSlugs = [...new Set(posts.map((p) => p.slug))]

/**
 * The docs in reading order, one entry per page, in the visitor's language.
 * A page may be `slug.mdx` or a `slug.en.mdx` / `slug.zh.mdx` pair; a page
 * with no file for the locale falls back (see pickLocalized) rather than
 * dropping out of the list.
 */
export function docsFor(locale: Locale) {
  return [...new Set(docs.map((d) => d.slug))]
    .map((slug) => pickLocalized(docs, slug, locale))
    .filter((d) => d !== undefined)
}
