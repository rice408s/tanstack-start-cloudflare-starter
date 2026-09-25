import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import {
  button,
  type EmailLocale,
  escapeHtml,
  keyValueTable,
  layout,
} from './layout'

export function formatMoney(
  cents: number,
  currency: string,
  locale: EmailLocale,
) {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function formatDate(date: Date, locale: EmailLocale) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
}

export function receiptEmail(params: {
  locale: EmailLocale
  item: string
  amount: number
  currency: string
  orderId: string
  date: Date
}) {
  const { locale } = params
  const app = appConfig.name
  return {
    subject: m.email_receipt_subject({ app }, { locale }),
    html: layout({
      locale,
      title: m.email_receipt_title({}, { locale }),
      bodyHtml: `<p style="margin:0">${escapeHtml(m.email_receipt_body({}, { locale }))}</p>${keyValueTable(
        [
          [m.email_receipt_item({}, { locale }), params.item],
          [
            m.email_receipt_amount({}, { locale }),
            formatMoney(params.amount, params.currency, locale),
          ],
          [
            m.email_receipt_date({}, { locale }),
            formatDate(params.date, locale),
          ],
          [m.email_receipt_order({}, { locale }), params.orderId],
        ],
      )}${button(m.email_receipt_manage({}, { locale }), `${appConfig.url}/dashboard`)}`,
    }),
  }
}
