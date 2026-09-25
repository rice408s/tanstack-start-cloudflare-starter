/**
 * Where to land after signing in. The value rides in a URL the visitor
 * controls, so only same-origin paths are honoured — anything else (absolute
 * URLs, protocol-relative `//evil.com`) falls back to the app home rather
 * than becoming an open redirect.
 */
export function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return '/dashboard'
  return value
}
