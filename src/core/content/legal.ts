import { z } from 'zod'
import type { Locale } from '@/paraglide/runtime'
import { collect, type MdxModule, pickLocalized } from './mdx'

// Legal pages are core, not part of the deletable `content` feature: a SaaS
// that takes payments needs Terms and Privacy regardless of blog/docs.
// One file per locale: content/legal/<slug>.<locale>.mdx
const legalSchema = z.object({
  title: z.string(),
  updated: z.string(),
})

export const legalSlugs = ['terms', 'privacy', 'dmca'] as const
export type LegalSlug = (typeof legalSlugs)[number]

const pages = collect(
  import.meta.glob('/content/legal/*.mdx', {
    query: '?meta',
    import: 'default',
    eager: true,
  }),
  import.meta.glob<MdxModule>('/content/legal/*.mdx'),
  legalSchema,
)

export function getLegalPage(slug: string, locale: Locale) {
  return pickLocalized(pages, slug, locale)
}
