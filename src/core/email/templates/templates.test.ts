import { describe, expect, it } from 'vitest'
import { appConfig } from '@/config/app-config'
import { accountClosedEmail, accountPurgeReminderEmail } from './account-closed'
import { paymentFailedEmail } from './payment-failed'
import { receiptEmail } from './receipt'
import { subscriptionCanceledEmail } from './subscription-canceled'
import { welcomeEmail } from './welcome'

describe('email templates', () => {
  it('welcome renders per locale and escapes the name', () => {
    const en = welcomeEmail({ name: '<Ada>', locale: 'en' })
    expect(en.subject).toBe(`Welcome to ${appConfig.name}`)
    expect(en.html).toContain('Welcome, &lt;Ada&gt;')
    expect(en.html).not.toContain('<Ada>')
    expect(en.html).toContain('/dashboard')

    const zh = welcomeEmail({ name: 'Ada', locale: 'zh' })
    expect(zh.subject).toBe(`欢迎加入 ${appConfig.name}`)
    expect(zh.html).toContain('lang="zh"')
  })

  it('receipt formats cents as currency and lists the order', () => {
    const mail = receiptEmail({
      locale: 'en',
      item: 'Pro plan',
      amount: 900,
      currency: 'USD',
      orderId: 'ord_123',
      date: new Date('2026-08-18T00:00:00Z'),
    })
    expect(mail.html).toContain('$9.00')
    expect(mail.html).toContain('ord_123')
    expect(mail.html).toContain('August 18, 2026')
    expect(mail.html).toContain('/dashboard')
  })

  it('canceled mentions the period end only when known', () => {
    const withEnd = subscriptionCanceledEmail({
      locale: 'zh',
      plan: 'Pro',
      periodEnd: new Date('2026-09-01T00:00:00Z'),
    })
    expect(withEnd.html).toContain('可使用至')
    const noEnd = subscriptionCanceledEmail({
      locale: 'en',
      plan: 'Pro',
      periodEnd: null,
    })
    expect(noEnd.html).not.toContain('Access until')
    expect(noEnd.html).toContain('/pricing')
  })

  it('payment failed names the amount, the retry date when known, and the card screen', () => {
    const mail = paymentFailedEmail({
      locale: 'en',
      plan: 'Pro',
      amount: 2999,
      currency: 'USD',
      nextAttemptAt: new Date('2026-09-20T00:00:00Z'),
    })
    expect(mail.html).toContain('$29.99')
    expect(mail.html).toContain('September 20, 2026')
    expect(mail.html).toContain('/billing')
    const noRetry = paymentFailedEmail({
      locale: 'zh',
      plan: 'Pro',
      amount: 2999,
      currency: 'USD',
      nextAttemptAt: null,
    })
    expect(noRetry.html).not.toContain('再次尝试')
  })

  it('account closed and its reminder name the erasure date, with no way in', () => {
    const purgeAt = new Date('2026-10-15T00:00:00Z')
    const closed = accountClosedEmail({ locale: 'en', purgeAt })
    expect(closed.subject).toContain(appConfig.name)
    expect(closed.html).toContain('October 15, 2026')
    // A closed account cannot sign in; a button into the app would dead-end.
    expect(closed.html).not.toContain('/dashboard')
    const reminder = accountPurgeReminderEmail({ locale: 'en', purgeAt })
    expect(reminder.subject).toContain('October 15, 2026')
    expect(accountPurgeReminderEmail({ locale: 'zh', purgeAt }).html).toContain(
      'lang="zh"',
    )
  })
})

describe('admin preview', () => {
  it('renders every template in every locale', async () => {
    const { emailTemplateIds, renderEmailPreview } = await import('./samples')
    for (const template of emailTemplateIds) {
      for (const locale of ['en', 'zh'] as const) {
        const mail = renderEmailPreview({ template, locale }, 'Ada')
        expect(mail.subject.length).toBeGreaterThan(0)
        expect(mail.html).toContain(`lang="${locale}"`)
      }
    }
  })
})
