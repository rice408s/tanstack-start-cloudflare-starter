import { describe, expect, it } from 'vitest'
import { isCrossSiteServerFnCall } from './same-origin'

const call = (path: string, headers: Record<string, string> = {}) =>
  isCrossSiteServerFnCall(
    new Request(`https://app.example.com${path}`, { headers }),
  )

describe('isCrossSiteServerFnCall', () => {
  it('refuses a server function reached from another site', () => {
    expect(call('/_serverFn/abc', { 'sec-fetch-site': 'cross-site' })).toBe(
      true,
    )
    expect(call('/_serverFn/abc', { 'sec-fetch-site': 'same-site' })).toBe(true)
  })

  it('lets the app call itself', () => {
    expect(call('/_serverFn/abc', { 'sec-fetch-site': 'same-origin' })).toBe(
      false,
    )
  })

  it('falls back to Origin when Sec-Fetch-Site is absent', () => {
    expect(call('/_serverFn/abc', { origin: 'https://evil.example' })).toBe(
      true,
    )
    expect(call('/_serverFn/abc', { origin: 'https://app.example.com' })).toBe(
      false,
    )
  })

  it('leaves non-browser callers and other paths alone', () => {
    expect(call('/_serverFn/abc')).toBe(false)
    expect(
      call('/api/webhooks/stripe', { 'sec-fetch-site': 'cross-site' }),
    ).toBe(false)
  })
})
