import { z } from 'zod'
import { locales } from '@/paraglide/runtime'
import { accountClosedEmail, accountPurgeReminderEmail } from './account-closed'
import { paymentFailedEmail } from './payment-failed'
import { receiptEmail } from './receipt'
import { subscriptionCanceledEmail } from './subscription-canceled'
import { welcomeEmail } from './welcome'

// Every template rendered with sample data — drives the /admin/emails
// preview and the template test. Register new templates here.
export const emailTemplateIds = [
  'welcome',
  'receipt',
  'canceled',
  'payment-failed',
  'account-closed',
  'account-purge-reminder',
] as const
export type EmailTemplateId = (typeof emailTemplateIds)[number]

export const emailPreviewInput = z.object({
  template: z.enum(emailTemplateIds),
  locale: z.enum(locales),
})

export function renderEmailPreview(
  input: z.infer<typeof emailPreviewInput>,
  name: string,
) {
  const { locale } = input
  switch (input.template) {
    case 'welcome':
      return welcomeEmail({ name, locale })
    case 'receipt':
      return receiptEmail({
        locale,
        item: locale === 'zh' ? 'Pro 套餐' : 'Pro plan',
        amount: 900,
        currency: 'USD',
        orderId: 'ord_sample_0001',
        date: new Date(),
      })
    case 'canceled':
      return subscriptionCanceledEmail({
        locale,
        plan: 'Pro',
        periodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      })
    case 'payment-failed':
      return paymentFailedEmail({
        locale,
        plan: 'Pro',
        amount: 2999,
        currency: 'USD',
        nextAttemptAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      })
    case 'account-closed':
      return accountClosedEmail({
        locale,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    case 'account-purge-reminder':
      return accountPurgeReminderEmail({
        locale,
        purgeAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      })
  }
}
