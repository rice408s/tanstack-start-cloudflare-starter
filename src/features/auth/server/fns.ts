import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import {
  collectAccountExport,
  dispatchAccountDeletionGuards,
} from '@/core/account/events'
import { audit, requestMeta } from '@/core/audit/events'
import { getDb } from '@/core/db'
import { emailLocale, sendEmailSafely } from '@/core/email/send'
import { accountClosedEmail } from '@/core/email/templates/account-closed'
import { authedFn } from '@/core/server/fn'
import { isLocale } from '@/paraglide/runtime'
import { ACCOUNT_RETENTION_DAYS } from '../config'
import { account, session, user } from '../schema'
import { getAuth, githubEnabled, googleEnabled } from './auth'

/**
 * Which sign-in buttons to offer. Public on purpose: /login has no session
 * yet. Read client-side, never in a loader — the marketing shell prerenders,
 * and a loader would bake the build machine's configuration into the page.
 * Emailed codes are always on, so only the OAuth providers are reported.
 */
export const getAuthProvidersFn = createServerFn({ method: 'GET' }).handler(
  async () => ({ google: googleEnabled(), github: githubEnabled() }),
)

// Nullable session for route guards — authedFn would redirect, this reports.
export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getAuth().api.getSession({ headers: getRequest().headers })
  },
)

// Settings → Preferences: the locale emails are sent in. The UI locale itself
// is paraglide's cookie/URL; the in-app switcher keeps both in step.
export const setMyLocaleFn = authedFn
  .validator(z.object({ locale: z.string().refine(isLocale) }))
  .handler(async ({ data, context }) => {
    await getDb()
      .update(user)
      .set({ locale: data.locale, updatedAt: new Date() })
      .where(eq(user.id, context.session.user.id))
    return { success: true }
  })

// Settings → Your data: everything we hold about the account, as JSON. The
// account itself plus one key per feature registered in core/account.
export const exportMyDataFn = authedFn.handler(async ({ context }) => {
  const me = context.session.user
  const db = getDb()
  const [[row], sessions, providers] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        locale: user.locale,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, me.id))
      .limit(1),
    db
      .select({
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, me.id)),
    db
      .select({ providerId: account.providerId, createdAt: account.createdAt })
      .from(account)
      .where(eq(account.userId, me.id)),
  ])
  const features = await collectAccountExport({ id: me.id, email: me.email })
  await audit({
    action: 'auth.data_exported',
    actorId: me.id,
    actorEmail: me.email,
    targetType: 'user',
    targetId: me.id,
    ...requestMeta(getRequest().headers),
  })
  return {
    exportedAt: new Date().toISOString(),
    account: { ...row, sessions, providers },
    ...features,
  }
})

// When a closed account will be erased, from its `deletedAt`.
async function purgeDateFor(deletedAt: Date) {
  return new Date(deletedAt.getTime() + ACCOUNT_RETENTION_DAYS * 86_400_000)
}

// better-auth's default `freshAge`: with no password to re-enter under OAuth,
// having signed in within the last day is the confirmation.
const FRESH_SESSION_MS = 24 * 60 * 60 * 1000

/**
 * Settings → Danger zone. CLOSES the account; the purge job erases it when the
 * retention window passes (see core/account/events.ts). Closing is immediate
 * and total from the user's side — every session and API key dies with it —
 * while every row stays for support to trace and an operator to restore.
 * Guards (a live subscription, an open payout) refuse with a code the UI maps.
 */
export const requestAccountDeletionFn = authedFn.handler(
  async ({ context }) => {
    const me = context.session.user
    const signedInAt = new Date(context.session.session.createdAt).getTime()
    if (Date.now() - signedInAt > FRESH_SESSION_MS) {
      throw new Error('SESSION_EXPIRED')
    }
    // The guards register when the account handlers load. Imported here, not
    // at the top: this file is bundled for the client too, and a top-level
    // side-effect import survives the build's .server() stripping.
    await import('@/core/account/handlers')
    await dispatchAccountDeletionGuards({ id: me.id, email: me.email })

    const db = getDb()
    const now = new Date()
    await db.batch([
      db
        .update(user)
        .set({ deletedAt: now, purgeRemindedAt: null, updatedAt: now })
        .where(and(eq(user.id, me.id), isNull(user.deletedAt))),
      db.delete(session).where(eq(session.userId, me.id)),
    ])
    const purgeAt = await purgeDateFor(now)
    await audit({
      action: 'auth.account_deletion_requested',
      actorId: me.id,
      actorEmail: me.email,
      targetType: 'user',
      targetId: me.id,
      meta: { purgeAt: purgeAt.toISOString() },
      ...requestMeta(getRequest().headers),
    })
    // The account can no longer tell them anything, so the inbox does: when
    // it goes for good, and that it can still be restored until then.
    const locale = emailLocale(me.locale)
    await sendEmailSafely({
      to: me.email,
      template: 'account-closed',
      userId: me.id,
      locale,
      ...accountClosedEmail({ locale, purgeAt }),
    })
    return { purgeAt }
  },
)
