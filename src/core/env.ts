import { z } from 'zod'
import { getBindings } from './server/cf'

// Treat empty strings from .dev.vars as "not set".
const optional = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().optional(),
)

// Secrets only — D1/R2 have no credentials, they are bindings in wrangler.jsonc.
// Local dev reads .dev.vars, production uses `wrangler secret put <NAME>`.
// Core secrets are required; module secrets are optional and asserted at use
// via requireEnv(), so deleting a feature never breaks startup.
const envSchema = z.object({
  APP_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  // Google is the baseline sign-in method, so its credentials are required.
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  // GitHub is optional: configure the pair and the button appears, leave them
  // empty and sign-in stays Google-only. Half a pair is a misconfiguration,
  // not a third state — see githubEnabled() in features/auth/server/auth.ts.
  GITHUB_CLIENT_ID: optional,
  GITHUB_CLIENT_SECRET: optional,
  // [feature: billing] — one provider takes new checkouts; see
  // core/payment/provider.ts. Both may be configured at once so existing
  // subscriptions on the other one keep working.
  // [core: email]
  RESEND_API_KEY: optional,
  // features/demo/server/plugin.ts. Never set it on a real deployment.
})

export type AppEnv = z.infer<typeof envSchema>

let cached: AppEnv | undefined

export function getEnv(): AppEnv {
  if (!cached) {
    const parsed = envSchema.safeParse(getBindings())
    if (!parsed.success) {
      throw new Error(
        `Missing or invalid environment secrets:\n${z.prettifyError(parsed.error)}`,
      )
    }
    cached = parsed.data
  }
  return cached
}

export function requireEnv(name: keyof AppEnv): string {
  const value = getEnv()[name]
  if (!value) {
    throw new Error(
      `Secret ${name} is not set. Add it to .dev.vars (local) or run \`wrangler secret put ${name}\` (production).`,
    )
  }
  return value
}
