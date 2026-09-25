import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import { type EmailLocale, escapeHtml, layout } from './layout'
import { formatDate } from './receipt'

// Closing an account is a close-then-purge (features/auth/server/fns.ts): the
// user is signed out at once and the data stays until `purgeAt`. Both emails
// say the same two things — when it goes for good, and that it can still be
// restored until then — because the account itself can no longer tell them.
// No button: a closed account cannot sign in, so there is nowhere to send them.

/** Sent when the user closes their account. */
export function accountClosedEmail(params: {
  locale: EmailLocale
  purgeAt: Date
}) {
  const { locale } = params
  const date = formatDate(params.purgeAt, locale)
  return {
    subject: m.email_account_closed_subject(
      { app: appConfig.name },
      { locale },
    ),
    html: layout({
      locale,
      title: m.email_account_closed_title({}, { locale }),
      bodyHtml: paragraphs(
        m.email_account_closed_body({ date }, { locale }),
        m.email_account_closed_restore({ app: appConfig.name }, { locale }),
      ),
    }),
  }
}

/** Sent a few days before a closed account is erased (the purge job). */
export function accountPurgeReminderEmail(params: {
  locale: EmailLocale
  purgeAt: Date
}) {
  const { locale } = params
  const date = formatDate(params.purgeAt, locale)
  return {
    subject: m.email_account_purge_reminder_subject(
      { app: appConfig.name, date },
      { locale },
    ),
    html: layout({
      locale,
      title: m.email_account_purge_reminder_title({}, { locale }),
      bodyHtml: paragraphs(
        m.email_account_purge_reminder_body({ date }, { locale }),
        m.email_account_closed_restore({ app: appConfig.name }, { locale }),
      ),
    }),
  }
}

function paragraphs(...lines: string[]) {
  return lines
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join('')
}
