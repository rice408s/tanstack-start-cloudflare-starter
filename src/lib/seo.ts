import { appConfig } from '@/config/app-config'

// Per-page meta set. The root route provides site-wide defaults
// (canonical, og:site_name, og:image, twitter:card); router head merging
// dedupes by name/property and the deepest match wins, so pages only
// declare what differs.
export function seo({
  title,
  description,
  article = false,
  image,
}: {
  title: string
  description?: string
  article?: boolean
  /** Absolute URL of a page-specific social card; the root's og.png otherwise. */
  image?: string
}) {
  const fullTitle =
    title === appConfig.name ? title : `${title} — ${appConfig.name}`
  return [
    { title: fullTitle },
    { property: 'og:title', content: fullTitle },
    { name: 'twitter:title', content: fullTitle },
    ...(description
      ? [
          { name: 'description', content: description },
          { property: 'og:description', content: description },
          { name: 'twitter:description', content: description },
        ]
      : []),
    ...(article ? [{ property: 'og:type', content: 'article' }] : []),
    ...(image
      ? [
          { property: 'og:image', content: image },
          { name: 'twitter:image', content: image },
        ]
      : []),
  ]
}
