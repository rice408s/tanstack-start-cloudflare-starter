// Top-level path segments that are not marketing content: signed-in pages,
// auth, API and utility routes. ONE list feeds both
//   - the prerender filter in vite.config.ts (a prerendered copy of a
//     guarded page would serve without its guard), and
//   - the Disallow lines scripts/generate-sitemap.ts writes into robots.txt.
// Add every new non-marketing route here — the prerender crawler follows
// links, so one link from a marketing page is enough to pull it in.
// Must stay importable from node (vite config, build scripts): no app imports.
export const privatePathSegments = [
  'login',
  'register',
  'waitlist',
  'dashboard',
  'billing',
  'credits',
  'files',
  'settings',
  'api-keys',
  'admin',
  'api',
  'test',
  'blocks',
] as const

// The trailing (\/|$) is load-bearing: without it every prefix match is
// accidental, and /api-keys would be excluded only because it starts with
// "api" (and a future /roadmap only because it starts with "r").
export const privatePathPattern = new RegExp(
  `^(\\/zh)?\\/(${privatePathSegments.join('|')})(\\/|$)`,
)

export function isPrivatePath(path: string): boolean {
  return privatePathPattern.test(path)
}

// robots.txt matches by prefix, so each segment gets an exact-match line
// (`$`, honoured by Google and Bing) and a subtree line — the same boundary
// as the regex above, instead of /r also blocking /roadmap.
export function robotsDisallowLines(): string[] {
  return ['', '/zh'].flatMap((locale) =>
    privatePathSegments.flatMap((segment) => [
      `Disallow: ${locale}/${segment}$`,
      `Disallow: ${locale}/${segment}/`,
    ]),
  )
}
