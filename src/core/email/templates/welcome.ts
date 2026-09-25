import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import { button, type EmailLocale, escapeHtml, layout } from './layout'

export function welcomeEmail(params: { name: string; locale: EmailLocale }) {
  const { locale } = params
  const app = appConfig.name
  const title = m.email_welcome_title({ name: params.name }, { locale })
  return {
    subject: m.email_welcome_subject({ app }, { locale }),
    html: layout({
      locale,
      title,
      bodyHtml: `<p style="margin:0 0 20px">${escapeHtml(m.email_welcome_body({}, { locale }))}</p>${button(
        m.email_open_app({ app }, { locale }),
        `${appConfig.url}/dashboard`,
      )}`,
    }),
  }
}
