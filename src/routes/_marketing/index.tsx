import { createFileRoute } from '@tanstack/react-router'
import { LandingBlocks } from '@/components/marketing/blocks/render'
import { appConfig } from '@/config/app-config'
import { landing } from '@/config/landing'
import { seo } from '@/lib/seo'
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// The landing page holds no copy and no layout: it renders the block array in
// `src/config/landing.ts`. Edit the page THERE — reorder a line, delete a
// line, add a line. The block shapes themselves live in
// `src/components/marketing/blocks/`, and every one of them renders with zero
// image assets so a fresh clone looks finished before you have any.
//
// What is worth keeping if you rewrite the page: every section below the fold
// enters on its own IntersectionObserver, sheet and plain grounds alternate,
// and nothing animates colour. The motion is deliberately quiet — a short
// rise into place, and nothing else. Entrances that crossed the viewport, the
// auto-advancing hero showcase and the scroll-linked closing line were all
// removed (2026-09-10): a reader evaluating a tool scans, and anything that
// moves while they read costs more than it earns. ScrollRevealText is still
// in lib/motion if you want it back.
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/_marketing/')({
  head: () => ({
    meta: seo({
      title: m.seo_home_title(),
      description: m.seo_default_description(),
    }),
    links: [
      // The slogan's face, used on this page alone — preloaded here rather
      // than site-wide so no other route pays for it.
      {
        rel: 'preload',
        href: '/fonts/bricolage-grotesque-latin.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: appConfig.name,
          url: appConfig.url,
        }),
      },
    ],
  }),
  component: Home,
})

function Home() {
  return <LandingBlocks blocks={landing} />
}
