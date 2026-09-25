// Cross-site request refusal for server functions.
//
// Server functions are the app's own RPC: the only legitimate caller is a page
// this origin served. Anything else carrying the user's cookie is a forgery,
// so it is refused before TanStack decodes a byte of it. API routes are not
// covered on purpose — webhooks and API-key clients come from elsewhere by
// design, and authenticate without cookies.

const SERVER_FN_PREFIX = '/_serverFn/'

/**
 * True when a browser says the request did not come from this origin.
 * `Sec-Fetch-Site` leads (every current browser sends it); `Origin` is the
 * fallback for one that does not. A request carrying neither is not a
 * browser, and a non-browser holds no victim's cookie to forge with.
 */
export function isCrossSiteServerFnCall(request: Request): boolean {
  const url = new URL(request.url)
  if (!url.pathname.startsWith(SERVER_FN_PREFIX)) return false
  const site = request.headers.get('sec-fetch-site')
  // `same-site` is refused too: a sibling subdomain is not this app.
  if (site) return site !== 'same-origin' && site !== 'none'
  const origin = request.headers.get('origin')
  return origin !== null && origin !== url.origin
}
