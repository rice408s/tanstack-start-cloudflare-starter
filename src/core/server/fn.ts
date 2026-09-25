import { redirect } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getAuth } from '@/features/auth/server/auth'

// The whole template's auth boilerplate lives in this middleware. Feature
// server functions start from authedFn and get a typed session in context —
// no per-function session checks.
//
// Nothing may be added to this file outside a `.server()` callback. It is
// bundled for the CLIENT too — server functions leave a stub here — and the
// build strips only what those callbacks reference. A plain exported helper
// that touches the database drags `cloudflare:workers` into the browser and
// the build fails somewhere else entirely.

const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getAuth().api.getSession({
      headers: getRequest().headers,
    })
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return next({ context: { session } })
  },
)

// POST, never the default GET. A GET server function runs straight from
// `?payload=` in the URL, and the session cookie is SameSite=lax — which a
// browser still sends on a top-level navigation from another site. As GET,
// any page could link a signed-in user into `requestAccountDeletionFn`. Reads pay nothing
// for this: loaders call these directly during SSR, and the client's fetch
// works the same either way. server.ts adds the second half, refusing
// cross-site calls to `/_serverFn` whatever the method.
export const authedFn = createServerFn({ method: 'POST' }).middleware([
  authMiddleware,
])
