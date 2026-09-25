import { appConfig } from '@/config/app-config'
import { getEnv } from '@/core/env'
import { isLocale, type Locale } from '@/paraglide/runtime'
import { emitEmailEvent } from './events'

// Resend REST API via fetch — no SDK. Templates are plain functions
// returning { subject, html } (see templates/); swap in react-email if your
// templates outgrow string literals.
//
// Email is optional infrastructure: without RESEND_API_KEY every send is a
// logged no-op, so local dev and feature deletion never depend on it.
//
// Every attempt is reported through core/email/events.ts (`template` names
// it, `userId` links it to the recipient) so a sink can keep a send log.
export type SendEmailParams = {
  to: string
  subject: string
  html: string
  template: string
  userId?: string | null
  locale?: string | null
}

export async function sendEmail(params: SendEmailParams) {
  const base = {
    template: params.template,
    to: params.to,
    subject: params.subject,
    userId: params.userId ?? null,
    locale: params.locale ?? null,
  }
  const apiKey = getEnv().RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped "${params.subject}" to ${params.to}`,
    )
    await emitEmailEvent({ ...base, status: 'skipped' })
    return { sent: false as const }
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${appConfig.name} <${appConfig.emailFrom}>`,
      // emailFrom is a noreply on the sending subdomain (see app-config).
      // Reply-To puts a real, routed inbox behind every receipt and
      // subscription notice — a customer hitting "reply" must reach someone.
      reply_to: appConfig.supportEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })
  if (!response.ok) {
    const error = `Resend failed (${response.status}): ${await response.text()}`
    await emitEmailEvent({
      ...base,
      status: 'failed',
      error: error.slice(0, 500),
    })
    throw new Error(error)
  }
  const providerId = await response
    .json()
    .then((j) => (j as { id?: string }).id ?? null)
    .catch(() => null)
  await emitEmailEvent({ ...base, status: 'sent', providerId })
  return { sent: true as const }
}

// Transactional emails are side effects of something more important (a
// signup, a paid webhook). Never let a mail failure fail the main action.
export async function sendEmailSafely(params: SendEmailParams) {
  try {
    await sendEmail(params)
  } catch (err) {
    console.error('[email] send failed', err)
  }
}

// user.locale is a free-form column; fall back to the base locale.
export function emailLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : 'en'
}
