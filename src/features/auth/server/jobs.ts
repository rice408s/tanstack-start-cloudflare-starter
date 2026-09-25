import { and, eq, gte, isNotNull, isNull, lt } from 'drizzle-orm'
import {
  dispatchAccountDeleted,
  dispatchAccountDeletionGuards,
  dispatchBeforeAccountDelete,
} from '@/core/account/events'
import '@/core/account/handlers'
import { audit } from '@/core/audit/events'
import { getDb } from '@/core/db'
import { emailLocale, sendEmailSafely } from '@/core/email/send'
import { accountPurgeReminderEmail } from '@/core/email/templates/account-closed'
import { registerJob } from '@/core/jobs/events'
import { ACCOUNT_RETENTION_DAYS } from '../config'
import { session, user, verification } from '../schema'

// better-auth expires rows logically but never deletes them; without this
// the session/verification tables grow forever.
registerJob({
  name: 'auth.purge-expired',
  run: async () => {
    const db = getDb()
    const now = new Date()
    const [s, v] = await db.batch([
      db.delete(session).where(lt(session.expiresAt, now)),
      db.delete(verification).where(lt(verification.expiresAt, now)),
    ])
    return `sessions=${s.meta.changes} verifications=${v.meta.changes}`
  },
})

const DAY_MS = 86_400_000

// How long before erasure a closed account hears from us once more — the last
// point where support can still restore it.
const PURGE_REMINDER_DAYS = 3

// Every closed account whose erasure is that close and has not been reminded
// yet — so a night the cron misses sends it the next night instead of never.
// Each send is claimed first with a conditional update on `purgeRemindedAt`,
// so a cron that fires twice, or two runs overlapping, still sends one email.
// Closing again and restoring both clear the flag.
registerJob({
  name: 'auth.remind-deleted-accounts',
  run: async () => {
    const db = getDb()
    const days = ACCOUNT_RETENTION_DAYS
    const now = new Date()
    // now < purgeAt <= now + REMINDER, where purgeAt = deletedAt + days. One
    // already past it is tonight's erasure; telling it "in a few days" would
    // be the last thing it ever received, and wrong.
    const threshold = new Date(
      now.getTime() + (PURGE_REMINDER_DAYS - days) * DAY_MS,
    )
    const cutoff = new Date(now.getTime() - days * DAY_MS)
    const due = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          lt(user.deletedAt, threshold),
          gte(user.deletedAt, cutoff),
          isNull(user.purgeRemindedAt),
        ),
      )
    let reminded = 0
    for (const { id } of due) {
      const [claimed] = await db
        .update(user)
        .set({ purgeRemindedAt: now })
        .where(
          and(
            eq(user.id, id),
            isNotNull(user.deletedAt),
            isNull(user.purgeRemindedAt),
          ),
        )
        .returning({
          email: user.email,
          locale: user.locale,
          deletedAt: user.deletedAt,
        })
      if (!claimed?.deletedAt) continue
      const locale = emailLocale(claimed.locale)
      await sendEmailSafely({
        to: claimed.email,
        template: 'account-purge-reminder',
        userId: id,
        locale,
        ...accountPurgeReminderEmail({
          locale,
          purgeAt: new Date(claimed.deletedAt.getTime() + days * DAY_MS),
        }),
      })
      reminded++
    }
    return `reminded=${reminded}`
  },
})

// A cron run's share of erasures. Each one walks every feature's cleanup (R2
// deletes, a provider call); a backlog clears over a few nights instead of
// holding one Worker invocation for minutes.
const PURGE_BATCH = 25

// Closed accounts whose retention window has passed are erased for good: the
// same guards as at closing (something may have opened since — an operator
// refunding into a payout, say), then every feature's cleanup, then the row
// and its cascades, then the after-hooks (audit email scrub, email log).
// One account failing never stops the rest; it is retried next night.
registerJob({
  name: 'auth.purge-deleted-accounts',
  run: async () => {
    const db = getDb()
    const days = ACCOUNT_RETENTION_DAYS
    const cutoff = new Date(Date.now() - days * 86_400_000)
    const due = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(and(isNotNull(user.deletedAt), lt(user.deletedAt, cutoff)))
      .limit(PURGE_BATCH)
    let purged = 0
    let skipped = 0
    for (const ref of due) {
      try {
        await dispatchAccountDeletionGuards(ref)
        await dispatchBeforeAccountDelete(ref)
        await db.delete(user).where(eq(user.id, ref.id))
        await dispatchAccountDeleted(ref)
        await audit({
          action: 'auth.account_deleted',
          targetType: 'user',
          targetId: ref.id,
          meta: { retentionDays: days },
        })
        purged++
      } catch (err) {
        console.error(`[auth.purge-deleted-accounts] ${ref.id} kept`, err)
        skipped++
      }
    }
    return `purged=${purged} skipped=${skipped}`
  },
})
