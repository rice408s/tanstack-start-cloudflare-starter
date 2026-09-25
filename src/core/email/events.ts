// Email delivery events, same self-loading registry as core/audit: sendEmail()
// reports every attempt (sent / skipped without API key / failed) and features
// that want to persist them register a sink. No sink = no-op, so the email
// layer never depends on the email-log feature existing.

export type EmailEvent = {
  // Template id (`welcome`, `receipt`, …) — whatever the caller passed.
  template: string
  to: string
  subject: string
  userId?: string | null
  locale?: string | null
  status: 'sent' | 'skipped' | 'failed'
  // Provider message id when sent, error text when failed.
  providerId?: string | null
  error?: string | null
}

type Sink = (event: EmailEvent) => Promise<void>

const sinks: Sink[] = []

export function onEmailEvent(sink: Sink) {
  sinks.push(sink)
}

let handlersLoaded: Promise<unknown> | undefined

// Best-effort: a logging failure never fails (or re-throws from) the send.
export async function emitEmailEvent(event: EmailEvent): Promise<void> {
  handlersLoaded ??= import('./handlers').catch((err) => {
    console.error('[email] failed to load sinks', err)
  })
  await handlersLoaded
  for (const sink of sinks) {
    try {
      await sink(event)
    } catch (err) {
      console.error('[email] sink failed', event.template, err)
    }
  }
}
