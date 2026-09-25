import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ErrorPage, NotFoundPage } from './components/error-pages'
import { getContext } from './integrations/tanstack-query/root-provider'
import { deLocalizeUrl, localizeUrl } from './paraglide/runtime'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Let React Query own caching: the router always runs a loader on
    // preload, and ensureQueryData inside it answers from the query cache
    // while the data is fresh (default staleTime in root-provider.tsx).
    defaultPreloadStaleTime: 0,
    // Branded 404/500 instead of the router's bare <p>Not Found</p>. ErrorPage
    // logs the error itself: console.error during SSR lands in Workers Logs,
    // in the browser it lands in the console.
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: ErrorPage,
    // Localized URLs (/zh/...) are rewritten to the unlocalized route tree,
    // so route files never deal with a locale segment.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
