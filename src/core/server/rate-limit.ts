import { getRequest } from '@tanstack/react-start/server'
import { getBindings } from './cf'

// Cloudflare's rate-limiting bindings (wrangler.jsonc `ratelimits`), keyed by
// client IP. Returns true when the caller is over the limit. Fails open if the
// binding is missing (e.g. a runtime without it) so a config gap never takes an
// endpoint down.
//
// One namespace, PUBLIC: write endpoints, tight (5/min) — an upload or a
// mailed sign-in code is a deliberate act. Add a namespace in wrangler.jsonc
// and to `Limiter` when an endpoint needs a looser limit.
//
// Not every caller needs this. Authenticated *reads* are cheap and session-
// bound; better-auth throttles its own surfaces. Reach
// for it where a request costs real resources (an R2 write, an upstream fetch)
// or where no session gates it at all.
type Limiter = 'PUBLIC_RATE_LIMIT'

export async function isRateLimited(
  scope: string,
  { headers, limiter = 'PUBLIC_RATE_LIMIT', key }: RateLimitOptions = {},
): Promise<boolean> {
  const binding = getBindings()[limiter]
  if (!binding) return false
  if (key) return !(await binding.limit({ key: `${scope}:${key}` })).success
  // Server functions run inside the request context, so headers are implicit.
  // Server route handlers already hold the Request and pass them in.
  const source = headers ?? getRequest().headers
  const ip =
    source.get('cf-connecting-ip') ??
    source.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  const { success } = await binding.limit({ key: `${scope}:${ip}` })
  return !success
}

export interface RateLimitOptions {
  /** Request headers. Omit inside a server fn; pass in a route handler. */
  headers?: Headers
  /** Which namespace to count against. Defaults to the tight one. */
  limiter?: Limiter
  /**
   * Count against this instead of the client IP — for a limit that protects
   * a THIRD party (the address a sign-in code is mailed to), where rotating
   * IPs must not reset the count.
   */
  key?: string
}

/** The response a throttled caller gets. Plain text — no body worth parsing. */
export function tooManyRequests(): Response {
  return new Response('Too many requests', {
    status: 429,
    headers: { 'retry-after': '60' },
  })
}
