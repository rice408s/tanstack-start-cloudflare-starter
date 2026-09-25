import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// No feature sinks: the test registers its own to observe what sendEmail reports.
vi.mock('./handlers', () => ({}))
vi.mock('@/core/env', () => ({ getEnv: () => ({ RESEND_API_KEY: env.key }) }))
vi.mock('@/paraglide/runtime', () => ({ isLocale: (v: unknown) => v === 'en' }))

const env = { key: undefined as string | undefined }
const events: unknown[] = []

const { onEmailEvent } = await import('./events')
const { sendEmail, sendEmailSafely } = await import('./send')
onEmailEvent(async (e) => {
  events.push(e)
})

const base = {
  to: 'a@x.test',
  subject: 'Hi',
  html: '<p>hi</p>',
  template: 'welcome',
  userId: 'u1',
}

describe('sendEmail reports every attempt', () => {
  beforeEach(() => {
    events.length = 0
    env.key = undefined
  })
  afterEach(() => vi.unstubAllGlobals())

  it('skipped without an API key', async () => {
    expect(await sendEmail(base)).toEqual({ sent: false })
    expect(events).toEqual([
      expect.objectContaining({
        status: 'skipped',
        template: 'welcome',
        userId: 'u1',
      }),
    ])
  })

  it('sent with the provider id', async () => {
    env.key = 'k'
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }),
      ),
    )
    expect(await sendEmail(base)).toEqual({ sent: true })
    expect(events).toEqual([
      expect.objectContaining({
        status: 'sent',
        providerId: 'msg_1',
        to: 'a@x.test',
      }),
    ])
  })

  it('failed with the error, and sendEmailSafely swallows it', async () => {
    env.key = 'k'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 422 })),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(sendEmail(base)).rejects.toThrow('Resend failed (422)')
    await sendEmailSafely(base)
    expect(events.map((e) => (e as { status: string }).status)).toEqual([
      'failed',
      'failed',
    ])
    expect(events[0]).toEqual(
      expect.objectContaining({ error: 'Resend failed (422): nope' }),
    )
  })
})
