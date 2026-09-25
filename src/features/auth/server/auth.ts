import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { emailOTP, oneTap } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { eq } from 'drizzle-orm'
import { dispatchAccountCreated } from '@/core/account/events'
import '@/core/account/handlers'
import { getDb } from '@/core/db'
import { emailLocale, sendEmail, sendEmailSafely } from '@/core/email/send'
import { loginCodeEmail } from '@/core/email/templates/login-code'
import { welcomeEmail } from '@/core/email/templates/welcome'
import { getEnv } from '@/core/env'
import * as schema from '../schema'
import { auditAfterHook, auditBeforeHook } from './audit-hook'

// Plugin/field changes here must be mirrored in auth.cli-config.ts,
// then run `bun run auth:generate` + `bun run db:generate`.

/**
 * Whether Google sign-in is configured. Both vars or neither, like GitHub
 * below: without them the app still boots, and signs in with emailed codes.
 */
export function googleEnabled(): boolean {
  const env = getEnv()
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

/**
 * Whether GitHub sign-in is configured. Both vars or neither: a lone id would
 * otherwise offer a button whose callback cannot complete.
 *
 * The login UI asks the same question through getAuthProvidersFn, so the
 * button and the provider can never disagree.
 */
export function githubEnabled(): boolean {
  const env = getEnv()
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
}

/** How long a sign-in code stays usable. Also quoted in the email. */
const OTP_EXPIRES_IN_SECONDS = 10 * 60

/**
 * The locale to write on a new row / mail a code in, read straight from the
 * locale cookie. The auth API URL is never locale-prefixed, so paraglide's URL
 * strategy would always answer 'en' here.
 */
async function localeFromCookie(headers?: Headers | null) {
  const { isLocale } = await import('@/paraglide/runtime')
  const cookie = headers?.get('cookie') ?? ''
  const value = /APP_LOCALE=([\w-]+)/.exec(cookie)?.[1]
  return isLocale(value) ? value : 'en'
}

function createAuth() {
  const env = getEnv()

  return betterAuth({
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    // The client IP, for better-auth's own rate limiter and the session
    // rows. Its default is `x-forwarded-for`, whose first hop is whatever
    // the caller typed; on Cloudflare only `cf-connecting-ip` is set by the
    // edge. The fallback is for a host that is not Cloudflare.
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
    },
    database: drizzleAdapter(getDb(), { provider: 'sqlite', schema }),
    // Passwordless throughout: no reset flow, no reset emails, no
    // register/login form split (the third door, an emailed code, is the
    // emailOTP plugin below). Google and GitHub each join only when both of
    // their vars are set, so a fresh clone boots with emailed codes alone and
    // still shows exactly the buttons that can work.
    socialProviders: {
      ...(googleEnabled()
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID as string,
              clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            },
          }
        : {}),
      ...(githubEnabled()
        ? {
            github: {
              clientId: env.GITHUB_CLIENT_ID as string,
              clientSecret: env.GITHUB_CLIENT_SECRET as string,
            },
          }
        : {}),
    },
    // Cookie session: valid 7 days, expiry refreshed at most once a day.
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        locale: { type: 'string', defaultValue: 'en', input: false },
        // Set when the user closes their account; the purge job erases the
        // row once the retention window passes (see core/account/events.ts).
        deletedAt: { type: 'date', required: false, input: false },
        // When the purge job sent the "erased in a few days" reminder, so it
        // goes out once per closing (see ./jobs.ts).
        purgeRemindedAt: { type: 'date', required: false, input: false },
      },
      // better-auth's own delete endpoint stays OFF: it erases on the spot,
      // and deletion here is a close-then-purge (requestAccountDeletionFn in
      // ./fns.ts, the purge job in ./jobs.ts). Enabled, any client could
      // call it directly and skip the retention window.
      deleteUser: { enabled: false },
    },
    // An OAuth callback that fails (a closed account, a denied consent) lands
    // back on the login page with `?error=<code>` instead of better-auth's
    // own unlocalized error page. The buttons pass the localized /login as
    // `errorCallbackURL`; this is the fallback for anything that does not.
    onAPIError: { errorURL: `${env.APP_URL}/login` },
    // Audit trail for sign-in/out and account deletion (core/audit; add a
    // sink there to store it).
    hooks: { before: auditBeforeHook, after: auditAfterHook },
    databaseHooks: {
      // A closed account cannot sign back in during its retention window —
      // not by OAuth, not by One Tap. Every sign-in creates a session, so
      // this is the one door to hold. Restoring is an operator's action.
      session: {
        create: {
          before: async (newSession) => {
            const [owner] = await getDb()
              .select({ deletedAt: schema.user.deletedAt })
              .from(schema.user)
              .where(eq(schema.user.id, newSession.userId))
              .limit(1)
            if (owner?.deletedAt) {
              throw new APIError('FORBIDDEN', {
                message: 'ACCOUNT_DELETED',
                code: 'ACCOUNT_DELETED',
              })
            }
          },
        },
      },
      user: {
        create: {
          // Stamp the signup-time locale so emails speak the user's language.
          // Signing in with a code carries no profile, so the name arrives
          // empty — the local part of the address is a better placeholder than
          // a blank greeting, and the user can change it in settings.
          // (Pure field defaulting — no external side effects here.)
          before: async (user, ctx) => {
            const locale = await localeFromCookie(ctx?.headers)
            const name = user.name?.trim() || user.email.split('@')[0] || ''
            return { data: { ...user, name, locale } }
          },
          // Welcome email + whatever else a new account needs (the free
          // plan's first credits). Both best-effort: neither may block the
          // sign-in redirect, and the monthly job backfills a missed grant.
          after: async (user, ctx) => {
            const locale = emailLocale(
              (user as { locale?: string | null }).locale,
            )
            const mail = welcomeEmail({ name: user.name, locale })
            await sendEmailSafely({
              to: user.email,
              template: 'welcome',
              userId: user.id,
              locale,
              ...mail,
            })
            // Headers ride along because attribution can only be read from
            // the signup request itself (see core/account/events.ts).
            await dispatchAccountCreated(
              { id: user.id, email: user.email },
              ctx?.headers ?? undefined,
            ).catch((err) => console.error('[account.created]', err))
          },
        },
      },
    },
    // tanstackStartCookies must stay last (it post-processes Set-Cookie).
    plugins: [
      oneTap(),
      // Sign in with a code mailed to the address — the third door beside the
      // two OAuth ones, and still no passwords: nothing to reset, nothing to
      // leak, no register/login split. An address nobody has used yet becomes
      // an account, exactly as a first Google sign-in does.
      //
      // The code is stored hashed, so the database never holds a live
      // credential, and it is burned after three wrong guesses. Sending is
      // throttled in front of better-auth, per IP and per address — see
      // routes/api/auth.$.ts for why its own limiter is not enough here.
      emailOTP({
        otpLength: 6,
        expiresIn: OTP_EXPIRES_IN_SECONDS,
        allowedAttempts: 3,
        storeOTP: 'hashed',
        sendVerificationOTP: async ({ email, otp, type }, ctx) => {
          // Only the sign-in flow is wired up. The plugin's other types
          // (password reset, email change) belong to features this template
          // does not have.
          if (type !== 'sign-in') return
          const [owner] = await getDb()
            .select({ id: schema.user.id, locale: schema.user.locale })
            .from(schema.user)
            .where(eq(schema.user.email, email))
            .limit(1)
          // A closed account still gets its code; the session hook below
          // refuses it at verification, where the page can explain why.
          const locale = emailLocale(
            owner?.locale ?? (await localeFromCookie(ctx?.headers)),
          )
          const mail = loginCodeEmail({
            locale,
            code: otp,
            minutes: OTP_EXPIRES_IN_SECONDS / 60,
          })
          // Not sendEmailSafely: this send IS the action, so a failure must
          // be loud. It still cannot reach the visitor — better-auth runs
          // this callback in the background so a slow provider can't be timed
          // to reveal who has an account — but it lands in the server log and
          // as a `failed` row in the email log, which is where an operator
          // looks when someone says no code arrived.
          const { sent } = await sendEmail({
            to: email,
            template: 'login-code',
            userId: owner?.id ?? null,
            locale,
            ...mail,
          })
          // Without RESEND_API_KEY every send is a no-op, which would make
          // this door unusable in a fresh clone. Print the code instead so
          // local dev works before any mail provider exists.
          if (!sent) {
            console.warn(`[auth] no mail provider — code for ${email}: ${otp}`)
          }
        },
      }),
      tanstackStartCookies(),
    ],
  })
}

let auth: ReturnType<typeof createAuth> | undefined

// Lazy so bindings/secrets are only read at request time, never during build.
export function getAuth() {
  auth ??= createAuth()
  return auth
}

export type Session = ReturnType<typeof createAuth>['$Infer']['Session']
