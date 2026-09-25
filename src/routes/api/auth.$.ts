import { createFileRoute } from '@tanstack/react-router'
import { isRateLimited, tooManyRequests } from '@/core/server/rate-limit'
import { getAuth } from '@/features/auth/server/auth'

// Mailing a sign-in code is the one better-auth endpoint that spends someone
// else's resources with no session in front of it: the operator's email
// quota, and the inbox of whoever's address was typed. better-auth's own
// limiter counts per IP in isolate memory — on Workers that is one counter
// per isolate, reset whenever one is recycled — so the shared Cloudflare
// limiter goes in front, twice: per IP, and per ADDRESS, because a caller
// rotating IPs is still mailing the same victim.
const SEND_CODE_PATH = '/email-otp/send-verification-otp'

async function sendCodeThrottled(request: Request): Promise<boolean> {
  if (!new URL(request.url).pathname.endsWith(SEND_CODE_PATH)) return false
  const { headers } = request
  if (await isRateLimited('otp-ip', { headers })) return true
  const body = await request
    .clone()
    .json<{ email?: unknown }>()
    .catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  return email ? isRateLimited('otp-to', { headers, key: email }) : false
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => getAuth().handler(request),
      POST: async ({ request }) =>
        (await sendCodeThrottled(request))
          ? tooManyRequests()
          : getAuth().handler(request),
    },
  },
})
