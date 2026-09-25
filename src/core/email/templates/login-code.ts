import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import { type EmailLocale, escapeHtml, layout } from './layout'

// The sign-in code, sent by features/auth/server/auth.ts (the emailOTP
// plugin). Deliberately no button and no link: the code is typed back into
// the tab the visitor already has open, so a forwarded copy of this mail
// signs nobody in, and there is nothing here for a scanner to click and burn.
// The code is in the subject too — most people never open the message.
export function loginCodeEmail(params: {
  locale: EmailLocale
  code: string
  minutes: number
}) {
  const { locale, code, minutes } = params
  const app = appConfig.name
  return {
    subject: m.email_login_code_subject({ code, app }, { locale }),
    html: layout({
      locale,
      title: m.email_login_code_title({}, { locale }),
      bodyHtml: [
        `<p style="margin:0 0 20px">${escapeHtml(
          m.email_login_code_body({ app, minutes }, { locale }),
        )}</p>`,
        `<p style="margin:0 0 20px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.2em">${escapeHtml(code)}</p>`,
        `<p style="margin:0;font-size:13px;color:#616c64">${escapeHtml(
          m.email_login_code_ignore({}, { locale }),
        )}</p>`,
      ].join(''),
    }),
  }
}
