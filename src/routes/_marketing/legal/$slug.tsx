import { createFileRoute, notFound } from '@tanstack/react-router'
import { getLegalPage, legalSlugs } from '@/core/content/legal'
import { MDXContent } from '@/core/content/mdx-content'
import { seo } from '@/lib/seo'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

// /legal/terms, /legal/privacy — locale picked from the current URL
// (paraglide), falling back to English when a translation is missing.
export const Route = createFileRoute('/_marketing/legal/$slug')({
  loader: async ({ params }) => {
    if (!(legalSlugs as readonly string[]).includes(params.slug)) {
      throw notFound()
    }
    const page = getLegalPage(params.slug, getLocale())
    if (!page) throw notFound()
    // The body is a chunk of its own; fetch it with the data so the page
    // renders in one pass.
    await page.load()
    return { title: page.title, updated: page.updated }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? seo({ title: loaderData.title }) : [],
  }),
  component: LegalPage,
})

function LegalPage() {
  const { slug } = Route.useParams()
  const page = getLegalPage(slug, getLocale())
  if (!page) return null

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">{page.title}</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        {m.legal_updated({ date: page.updated })}
      </p>
      <MDXContent load={page.load} />
    </article>
  )
}
