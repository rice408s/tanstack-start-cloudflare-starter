import { expect, test } from '@playwright/test'

// Every Worker response carries the security headers from
// src/core/server/security-headers.ts (public/_headers covers prerendered
// pages in production, which the dev server serves through the Worker).
const PATHS = ['/', '/zh/blog', '/dashboard', '/api/auth/get-session']

for (const path of PATHS) {
  test(`security headers on ${path}`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 })
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
    expect(res.headers()['x-frame-options']).toBe('DENY')
    expect(res.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(res.headers()['permissions-policy']).toContain('camera=()')
  })
}
