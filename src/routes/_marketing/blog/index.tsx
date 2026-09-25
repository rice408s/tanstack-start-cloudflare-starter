import { createFileRoute, Link } from '@tanstack/react-router'
import { pickLocalized } from '@/core/content/mdx'
import { categoryLabel } from '@/features/content/category'
import {
  type PostCategory,
  postCategories,
  postSlugs,
  posts,
} from '@/features/content/collections'
import { PostCard } from '@/features/content/post-card'
import { seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

const isCategory = (v: unknown): v is PostCategory =>
  typeof v === 'string' && (postCategories as readonly string[]).includes(v)

// The filter lives in the URL (`?category=guide`) so a filtered view can be
// linked, but it is not its own page: the prerendered index carries every
// post and the pills narrow it client-side.
export const Route = createFileRoute('/_marketing/blog/')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { category?: PostCategory } =>
    isCategory(search.category) ? { category: search.category } : {},
  head: () => ({
    meta: seo({
      title: m.nav_blog(),
      description: m.seo_blog_description(),
    }),
  }),
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const locale = getLocale()
  const { category } = Route.useSearch()
  const entries = postSlugs
    .map((slug) => pickLocalized(posts, slug, locale))
    .filter((post) => post !== undefined)
    .filter((post) => !category || post.category === category)
    .sort((a, b) => b.date.localeCompare(a.date))
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col gap-4">
        <p className="kicker">{m.blog_kicker()}</p>
        <h1 className="text-4xl font-medium leading-[1.0] tracking-[-0.025em] sm:text-5xl">
          {m.blog_title()}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {m.blog_lead()}
        </p>
      </div>
      <nav aria-label={m.blog_kicker()} className="mt-10 flex flex-wrap gap-2">
        <CategoryPill active={!category} label={m.blog_category_all()} />
        {postCategories.map((c) => (
          <CategoryPill
            key={c}
            active={category === c}
            category={c}
            label={categoryLabel[c]()}
          />
        ))}
      </nav>
      {entries.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-muted-foreground">{m.blog_empty()}</p>
      )}
    </section>
  )
}

function CategoryPill({
  active,
  category,
  label,
}: {
  active: boolean
  category?: PostCategory
  label: string
}) {
  return (
    <Link
      to="/blog"
      search={category ? { category } : {}}
      resetScroll={false}
      // Exact search match, otherwise the "All" pill (empty search) counts
      // as active on every filtered view.
      activeOptions={{ exact: true, includeSearch: true }}
      className={cn(
        'rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'bg-surface text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </Link>
  )
}
