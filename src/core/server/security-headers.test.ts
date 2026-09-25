import { describe, expect, it } from 'vitest'
import { HSTS, SECURITY_HEADERS, withSecurityHeaders } from './security-headers'

describe('withSecurityHeaders', () => {
  it('adds every header and keeps status/body', async () => {
    const res = withSecurityHeaders(
      new Response('hi', { status: 201, headers: { 'X-Custom': '1' } }),
      new Request('http://localhost:3000/'),
    )
    expect(res.status).toBe(201)
    expect(await res.text()).toBe('hi')
    expect(res.headers.get('X-Custom')).toBe('1')
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      expect(res.headers.get(k)).toBe(v)
    }
  })

  it('sends HSTS only over https', () => {
    const http = withSecurityHeaders(
      new Response(),
      new Request('http://x.test/'),
    )
    const https = withSecurityHeaders(
      new Response(),
      new Request('https://x.test/'),
    )
    expect(http.headers.get('Strict-Transport-Security')).toBeNull()
    expect(https.headers.get('Strict-Transport-Security')).toBe(HSTS)
  })

  it('does not override headers a handler set itself', () => {
    const res = withSecurityHeaders(
      new Response(null, { headers: { 'X-Frame-Options': 'SAMEORIGIN' } }),
      new Request('https://x.test/'),
    )
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })
})
