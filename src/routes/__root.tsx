import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'
import { lazy, Suspense, useEffect, useState } from 'react'

import { getLocale, locales, localizeHref } from '#/paraglide/runtime'
import {
  ThemeStyleProvider,
  themeStyleScript,
} from '@/components/theme-provider'
import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import appCss from '../styles.css?url'

// Devtools are dev-only. The dynamic import sits behind a compile-time
// constant, so production builds drop it and its chunk entirely.
const Devtools = import.meta.env.DEV
  ? lazy(() => import('@/components/devtools'))
  : () => null

// The social card (public/og.png, drawn by scripts/og-card.html). X and the
// other crawlers cache a card image by its URL for about a week, so a redraw
// that keeps the same URL keeps showing the old picture. Bump `v` whenever
// the image changes: the new URL is a cache miss everywhere, and the query
// string is ignored when the file is served.
const socialCard = `${appConfig.url}/og.png?v=1`

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  head: ({ matches }) => {
    // hreflang alternates for every locale variant of the current page.
    // The router works with delocalized paths; localizeHref maps them back.
    const pathname = matches[matches.length - 1]?.pathname ?? '/'
    // Index routes match as `/blog/` and the zh home localizes to `/zh/`, but
    // the asset layer serves the slashless URL and 307s the other one
    // (`html_handling: drop-trailing-slash` in wrangler.jsonc) — and the
    // sitemap lists the slashless form. A canonical that redirects is one a
    // crawler is entitled to ignore, so say the URL that actually answers.
    const href = (path: string) =>
      appConfig.url + (path.length > 1 ? path.replace(/\/+$/, '') : path)
    // Self-canonical: the localized URL of the page being served.
    const canonical = href(localizeHref(pathname))
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        // Site-wide defaults — pages override title/description/og:* via
        // the seo() helper; head merging dedupes by name/property.
        {
          title: appConfig.name,
        },
        {
          name: 'description',
          content: m.seo_default_description(),
        },
        { property: 'og:site_name', content: appConfig.name },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: appConfig.name },
        { property: 'og:description', content: m.seo_default_description() },
        { property: 'og:url', content: canonical },
        { property: 'og:image', content: socialCard },
        {
          property: 'og:locale',
          content: getLocale() === 'zh' ? 'zh_CN' : 'en_US',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: socialCard },
      ],
      links: [
        {
          rel: 'preload',
          href: '/fonts/manrope-latin.woff2',
          as: 'font',
          type: 'font/woff2',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: appCss,
        },
        { rel: 'canonical', href: canonical },
        ...locales.map((locale) => ({
          rel: 'alternate',
          hrefLang: locale,
          href: href(localizeHref(pathname, { locale })),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: href(pathname),
        },
      ],
    }
  },
  shellComponent: RootDocument,
})

// sonner is 30 KB and every page mounts a Toaster, but a toast is only ever
// raised by something the visitor does. So it is fetched after hydration, off
// the critical path, rather than shipped in the entry. A toast raised before
// it arrives is not lost: the Toaster replays what is already queued (see
// components/ui/sonner.tsx).
const Toaster = lazy(() =>
  import('@/components/ui/sonner').then((mod) => ({ default: mod.Toaster })),
)

function LazyToaster() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  ) : null
}

const LOCALE_REDIRECT = `(function(){try{var p=location.pathname;if(p==='/zh'||p.indexOf('/zh/')===0)return;var c=/(?:^|; )APP_LOCALE=([^;]+)/.exec(document.cookie);var l=c?c[1]:((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase().indexOf('zh')===0?'zh':'en';if(l==='zh')location.replace('/zh'+(p==='/'?'':p)+location.search+location.hash)}catch(e){}})()`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        {/* The marketing pages are PRERENDERED and served without the Worker,
            and the URL strategy makes every unprefixed path English — so
            nothing on the server can act on the reader's language. This runs
            first because it may replace the document: it honours the
            remembered choice (APP_LOCALE, written by setLocale) or, on a
            first visit, the browser's own language. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a static constant, no input
          dangerouslySetInnerHTML={{ __html: LOCALE_REDIRECT }}
        />
        <HeadContent />
        {/* Applies the reader's visual STYLE (data-theme) before first paint.
            next-themes ships the same trick for light/dark from inside its
            own bundle; the style axis is ours, so its script is ours too. It
            has to stay in <head> and stay blocking — deferred, the document
            would paint the default look for a frame and then snap. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a build-time constant from the theme registry, no user input
          dangerouslySetInnerHTML={{ __html: themeStyleScript }}
        />
        {/* The scroll reveals (.appear* in styles.css) start hidden and are
            shown by an observer that only exists after hydration. Without
            JavaScript nothing would ever add `.in`, and every section below
            the hero would stay invisible — so without it, skip the effect. */}
        <noscript>
          <style>{`.appear,.appear-pop,.appear-slide,.appear-glide,.appear-mask>*,.appear-wipe,.appear-wipe img{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body>
        {/* Light is the default (user-confirmed 2026-09-17): the design
            language is written for the neutral light ground first (see
            src/CLAUDE.md), so a visitor who has never touched the toggle sees
            that, whatever their OS says. ThemeToggle writes an explicit
            choice that wins from then on; enableSystem stays on so "system"
            remains a settable value. Both token blocks live in styles.css.

            This is the MODE axis only. The visual STYLE (which palette,
            radius, borders and typeface) is the orthogonal axis, owned by
            ThemeStyleProvider inside it — see src/config/themes.ts. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeStyleProvider>{children}</ThemeStyleProvider>
          <LazyToaster />
          <Suspense fallback={null}>
            <Devtools />
          </Suspense>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
