import { m } from '@/paraglide/messages'
import type { PostCategory } from './collections'

// One label function per category so Paraglide can tree-shake and the
// index and post pages agree on the wording.
export const categoryLabel: Record<PostCategory, () => string> = {
  guide: m.blog_category_guide,
  specs: m.blog_category_specs,
  example: m.blog_category_example,
}
