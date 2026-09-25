import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP, oneTap } from 'better-auth/plugins'

// Used ONLY by `bun run auth:generate` to (re)generate src/features/auth/schema.ts.
// The Better Auth CLI runs in Node and cannot resolve `cloudflare:workers`,
// so this mirrors the plugin/field setup of src/features/auth/server/auth.ts
// without touching bindings. Keep the two in sync.
export const auth = betterAuth({
  database: drizzleAdapter({} as never, { provider: 'sqlite' }),
  // Social providers do not add columns, so only the shape matters here, not
  // the list: the real config also offers GitHub when it is configured.
  socialProviders: {
    google: { clientId: 'cli-placeholder', clientSecret: 'cli-placeholder' },
  },
  user: {
    additionalFields: {
      locale: { type: 'string', defaultValue: 'en', input: false },
      deletedAt: { type: 'date', required: false, input: false },
      purgeRemindedAt: { type: 'date', required: false, input: false },
    },
    deleteUser: { enabled: false },
  },
  plugins: [
    oneTap(),
    // Codes live in the `verification` table better-auth already has, so this
    // adds no columns — it is here only to keep the two configs comparable.
    emailOTP({ sendVerificationOTP: async () => {} }),
  ],
})
