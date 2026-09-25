import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'

// One HTML shell for every transactional email. Inline styles only (email
// clients strip <style>), same restraint as the app: sans-serif, one ink
// color, a single pill button, no images.
export type EmailLocale = Locale

// Hex equivalents of the light-theme tokens in src/styles.css (email clients
// don't understand oklch). Recompute if the palette changes.
const color = {
  ink: '#263129', // --foreground
  muted: '#616c64', // --muted-foreground
  faint: '#8a938e', // footer, one step lighter than muted
  page: '#edf4ee', // --secondary
  card: '#ffffff',
  primary: '#3f7e57', // --primary
  primaryFg: '#fafdfa', // --primary-foreground
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function button(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:${color.primary};color:${color.primaryFg};text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`
}

export function keyValueTable(rows: Array<[label: string, value: string]>) {
  const tr = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:${color.muted};font-size:14px">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px;color:${color.ink}">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">${tr}</table>`
}

export function layout(params: {
  locale: EmailLocale
  title: string
  // Already-escaped HTML fragments.
  bodyHtml: string
}) {
  const { locale } = params
  const app = appConfig.name
  return `<!doctype html>
<html lang="${locale}">
<body style="margin:0;padding:0;background:${color.page}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.page};padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${color.card};border-radius:16px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${color.ink};line-height:1.55">
<tr><td style="font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${color.muted};padding-bottom:16px">${escapeHtml(app)}</td></tr>
<tr><td style="font-size:22px;font-weight:700;padding-bottom:12px">${escapeHtml(params.title)}</td></tr>
<tr><td style="font-size:15px">${params.bodyHtml}</td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:${color.faint}">${escapeHtml(m.email_footer({ app }, { locale }))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
