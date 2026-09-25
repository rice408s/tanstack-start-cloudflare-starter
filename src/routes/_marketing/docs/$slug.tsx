import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { MDXContent } from '@/core/content/mdx-content'
import {
  type DocGroup,
  docGroups,
  docsFor,
} from '@/features/content/collections'
import { TableOfContents } from '@/features/content/toc'
import { seo } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

export const Route = createFileRoute('/_marketing/docs/$slug')({
  loader: async ({ params }) => {
    const doc = docsFor(getLocale()).find((d) => d.slug === params.slug)
    if (!doc) throw notFound()
    // The body is a chunk of its own; fetch it with the data so the page
    // renders in one pass.
    const { headings = [] } = await doc.load()
    return { title: doc.title, description: doc.description, headings }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? seo({ title: loaderData.title, description: loaderData.description })
      : [],
  }),
  component: DocPage,
})

const groupLabel: Record<DocGroup, () => string> = {
  start: m.docs_group_start,
  concepts: m.docs_group_concepts,
  features: m.docs_group_features,
  customize: m.docs_group_customize,
  reference: m.docs_group_reference,
}

// The usual docs shape on the site's full width: the page list on the left,
// grouped by section (sticky on desktop, a scrolling row of pills on a phone),
// the page itself at reading measure with the previous/next page at the
// bottom, and on a wide screen the page's own headings on the right.
function DocPage() {
  const { slug } = Route.useParams()
  const { headings } = Route.useLoaderData()
  const docs = docsFor(getLocale())
  const index = docs.findIndex((d) => d.slug === slug)
  const doc = docs[index]
  if (!doc) return null
  const prev = docs[index - 1]
  const next = docs[index + 1]

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:py-16 xl:grid-cols-[14rem_minmax(0,1fr)_12rem]">
      <aside>
        <nav
          aria-label={m.docs_kicker()}
          className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
        >
          {/* One scrolling row of pills on a phone, sections on desktop. */}
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-6 lg:overflow-visible lg:px-0">
            {docGroups.map((group) => {
              const pages = docs.filter((d) => d.group === group)
              if (pages.length === 0) return null
              return (
                <li
                  key={group}
                  className="contents lg:flex lg:flex-col lg:gap-2"
                >
                  <p className="kicker hidden lg:block">
                    {groupLabel[group]()}
                  </p>
                  <ul className="contents lg:flex lg:flex-col lg:gap-0.5">
                    {pages.map((d) => (
                      <li key={d.slug} className="shrink-0">
                        <Link
                          to="/docs/$slug"
                          params={{ slug: d.slug }}
                          aria-current={d.slug === slug ? 'page' : undefined}
                          className={cn(
                            'block rounded-[var(--radius-btn)] px-4 py-2 text-sm whitespace-nowrap transition-colors lg:rounded-lg lg:px-3 lg:py-1.5 lg:whitespace-normal',
                            d.slug === slug
                              ? 'bg-secondary font-medium text-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {d.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <article className="min-w-0 max-w-3xl">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
            {doc.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {doc.description}
          </p>
        </header>
        <div className="mt-10">
          <MDXContent load={doc.load} />
        </div>

        {prev || next ? (
          <nav className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {prev ? (
              <PageLink
                slug={prev.slug}
                title={prev.title}
                label={m.docs_prev()}
                dir="prev"
              />
            ) : (
              <span className="hidden sm:block" />
            )}
            {next ? (
              <PageLink
                slug={next.slug}
                title={next.title}
                label={m.docs_next()}
                dir="next"
              />
            ) : null}
          </nav>
        ) : null}
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  )
}

function PageLink({
  slug,
  title,
  label,
  dir,
}: {
  slug: string
  title: string
  label: string
  dir: 'prev' | 'next'
}) {
  const Icon = dir === 'prev' ? ArrowLeftIcon : ArrowRightIcon
  return (
    <Link
      to="/docs/$slug"
      params={{ slug }}
      // The two spans sit on separate lines, but their text runs together
      // ("NextStripe or Creem") for screen readers and text extraction.
      aria-label={`${label}: ${title}`}
      className={cn(
        'flex flex-col gap-1 rounded-2xl bg-secondary px-5 py-4 transition-colors hover:bg-surface',
        dir === 'next' && 'sm:items-end sm:text-right',
      )}
    >
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {dir === 'prev' ? <Icon className="size-4" /> : null}
        {label}
        {dir === 'next' ? <Icon className="size-4" /> : null}
      </span>
      <span className="font-medium">{title}</span>
    </Link>
  )
}
