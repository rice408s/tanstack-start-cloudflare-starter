import handler from '@tanstack/react-start/server-entry'
import { runJobs } from './core/jobs/events'
import './core/jobs/handlers'
import { isCrossSiteServerFnCall } from './core/server/same-origin'
import { withSecurityHeaders } from './core/server/security-headers'
import { paraglideMiddleware } from './paraglide/server.js'

// Scopes the request's locale (from URL/cookie) so server-side getLocale()
// and localizeUrl() resolve correctly during SSR. Bindings are not passed
// through here — server code reads them via `cloudflare:workers` (core/server/cf.ts).
// Every response leaves with the security headers from core/server/security-headers.ts.
export default {
  async fetch(req) {
    if (isCrossSiteServerFnCall(req)) {
      return withSecurityHeaders(
        new Response('Cross-site request refused', { status: 403 }),
        req,
      )
    }
    const res = await paraglideMiddleware(req, () => handler.fetch(req))
    return withSecurityHeaders(res, req)
  },
  // Cron from wrangler.jsonc `triggers`. Locally: `curl "localhost:3000/cdn-cgi/handler/scheduled"`
  // (or `wrangler dev --test-scheduled`) fires it on demand.
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(runJobs())
  },
} satisfies ExportedHandler<Env>
