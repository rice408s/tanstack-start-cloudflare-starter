import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import { button, type EmailLocale, escapeHtml, layout } from './layout'
import { formatDate, formatMoney } from './receipt'

// A renewal charge failed and the provider is retrying. Sent once per failure
// streak (see the billing handler), and it leads straight to the card screen:
// the only thing the reader can usefully do is fix the card.
export function paymentFailedEmail(params: {
  locale: EmailLocale
  plan: string
  amount: number
  currency: string
  nextAttemptAt: Date | null
}) {
  const { locale, plan } = params
  const body = m.email_payment_failed_body(
    { plan, amount: formatMoney(params.amount, params.currency, locale) },
    { locale },
  )
  const retry = params.nextAttemptAt
    ? `<p style="margin:0 0 20px">${escapeHtml(
        m.email_payment_failed_retry(
          { date: formatDate(params.nextAttemptAt, locale) },
          { locale },
        ),
      )}</p>`
    : ''
  return {
    subject: m.email_payment_failed_subject(
      { app: appConfig.name },
      { locale },
    ),
    html: layout({
      locale,
      title: m.email_payment_failed_title({}, { locale }),
      bodyHtml: `<p style="margin:0 0 12px">${escapeHtml(body)}</p>${retry}${button(
        m.email_payment_failed_cta({}, { locale }),
        `${appConfig.url}/billing`,
      )}`,
    }),
  }
}
