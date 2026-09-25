import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import { button, type EmailLocale, escapeHtml, layout } from './layout'
import { formatDate } from './receipt'

export function subscriptionCanceledEmail(params: {
  locale: EmailLocale
  plan: string
  periodEnd: Date | null
}) {
  const { locale, plan } = params
  const app = appConfig.name
  const body = params.periodEnd
    ? m.email_canceled_body({ plan }, { locale })
    : m.email_canceled_body_no_period({ plan }, { locale })
  const until = params.periodEnd
    ? `<p style="margin:0 0 20px;font-weight:600">${escapeHtml(
        m.email_canceled_until(
          { date: formatDate(params.periodEnd, locale) },
          { locale },
        ),
      )}</p>`
    : ''
  return {
    subject: m.email_canceled_subject({ app }, { locale }),
    html: layout({
      locale,
      title: m.email_canceled_title({}, { locale }),
      bodyHtml: `<p style="margin:0 0 12px">${escapeHtml(body)}</p>${until}${button(
        m.email_canceled_resubscribe({}, { locale }),
        `${appConfig.url}/pricing`,
      )}`,
    }),
  }
}
