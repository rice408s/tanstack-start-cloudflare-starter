// Security response headers, applied to every Worker response (src/server.ts).
// Prerendered marketing pages and static assets are served by Cloudflare's
// asset layer without touching the Worker — public/_headers carries the same
// set for them. Keep the two lists in sync.
//
// No Content-Security-Policy on purpose: TanStack Start hydrates through inline
// scripts, so a useful CSP needs per-request nonces threaded into the shell.
// Add one when you have that; a policy with 'unsafe-inline' buys nothing.
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // allow-popups, not same-origin: Google Identity Services opens a popup
  // that must keep window.opener to hand the credential back. Plain
  // same-origin severs it and One Tap dies with "Not a valid popup window".
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

// Two years, only when the request itself is HTTPS — never on localhost.
export const HSTS = 'max-age=63072000; includeSubDomains'

export function withSecurityHeaders(res: Response, req: Request): Response {
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v)
  }
  if (
    req.url.startsWith('https://') &&
    !headers.has('Strict-Transport-Security')
  ) {
    headers.set('Strict-Transport-Security', HSTS)
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
    // Preserve WebSocket upgrades / streaming semantics.
    ...('webSocket' in res && res.webSocket
      ? { webSocket: res.webSocket }
      : {}),
  })
}
