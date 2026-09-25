import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { appConfig } from '@/config/app-config'
import { pickLocalized } from '@/core/content/mdx'
import { MDXContent } from '@/core/content/mdx-content'
import { categoryLabel } from '@/features/content/category'
import { postSlugs, posts } from '@/features/content/collections'
import { Cover, coverPath } from '@/features/content/cover'
import { PostCard } from '@/features/content/post-card'
import { TableOfContents } from '@/features/content/toc'
import { seo } from '@/lib/seo'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

// A post is one column — back link, title, cover, prose, all on the same
// edges — followed by the other posts as cards. Locale is picked from the
// URL, English standing in for a missing translation.
export const Route = createFileRoute('/_marketing/blog/$slug')({
  // Functions aren't serializable; the loader validates the slug, fetches
  // the body's chunk so the page renders in one pass, and hands the head its
  // plain fields.
  loader: async ({ params }) => {
    if (!postSlugs.includes(params.slug)) throw notFound()
    const post = pickLocalized(posts, params.slug, getLocale())
    if (!post) throw notFound()
    const { load, ...data } = post
    const { headings = [] } = await load()
    return { ...data, headings }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({
          title: loaderData.title,
          description: loaderData.description,
          article: true,
          image: `${appConfig.url}${coverPath(loaderData.cover)}`,
        })
      : [],
    scripts: loaderData
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: loaderData.title,
              description: loaderData.description,
              datePublished: loaderData.date,
              image: `${appConfig.url}${coverPath(loaderData.cover)}`,
              publisher: { '@type': 'Organization', name: appConfig.name },
            }),
          },
        ]
      : [],
  }),
  component: BlogPostPage,
})

function BlogPostPage() {
  const { slug } = Route.useParams()
  const { headings } = Route.useLoaderData()
  const locale = getLocale()
  const post = pickLocalized(posts, slug, locale)
  if (!post) return null
  const more = postSlugs
    .filter((s) => s !== slug)
    .map((s) => pickLocalized(posts, s, locale))
    .filter((p) => p !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* The docs page's shape: a sticky list on the left (here, the post's
          own headings) and the article beside it. Below lg the list is
          dropped and the article runs the full width. The more-posts list
          sits in the same right-hand column, so the list stays put until
          the footer rather than scrolling off where the article ends. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          {/* top-32 = header + this page's top padding: the list sticks where
              it starts, so it never slides at the top of a scroll. */}
          <div className="sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <TableOfContents headings={headings} />
          </div>
        </aside>
        <div className="min-w-0 max-w-4xl">
          <article>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" />
              {m.blog_back()}
            </Link>
            <header className="mt-8 flex flex-col gap-4">
              <p className="kicker">
                {categoryLabel[post.category]()}
                <span className="font-normal tracking-normal normal-case">
                  {' / '}
                  {post.date}
                </span>
              </p>
              <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">
                {post.title}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {post.description}
              </p>
            </header>
            <Cover
              cover={post.cover}
              alt={post.title}
              eager
              className="mt-10 aspect-[16/9] rounded-3xl"
            />
            <div className="mt-12">
              <MDXContent load={post.load} />
            </div>
          </article>

          {more.length > 0 ? (
            <section className="mt-24">
              <h2 className="text-2xl font-medium tracking-[-0.01em]">
                {m.blog_more()}
              </h2>
              <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
