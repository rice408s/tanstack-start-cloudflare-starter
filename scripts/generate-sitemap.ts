// Post-build step: emit dist/client/sitemap.xml from the prerendered page
// tree and write robots.txt's Disallow + Sitemap lines. Runs via `bun run build`.
// The page list IS the prerender output — nothing to keep in sync by hand.
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appConfig } from '../src/config/app-config'
import { robotsDisallowLines } from '../src/config/private-paths'

const clientDir = fileURLToPath(new URL('../dist/client', import.meta.url))

// Collect every prerendered page as its URL path ('/': root index.html).
function collectPages(dir: string, prefix = ''): { path: string; mtime: Date }[] {
  const pages: { path: string; mtime: Date }[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      pages.push(...collectPages(full, `${prefix}/${entry}`))
    } else if (entry === 'index.html') {
      // Redirect routes (e.g. /docs → /docs/getting-started) prerender the
      // target's content with a canonical pointing elsewhere — keep them
      // out of the sitemap, the canonical already resolves them.
      const path = prefix || '/'
      const canonical = readFileSync(full, 'utf-8').match(
        /rel="canonical" href="([^"]+)"/,
      )?.[1]
      const norm = (u: string) => u.replace(/\/+$/, '')
      if (canonical && norm(canonical) !== norm(appConfig.url + path)) continue
      pages.push({ path, mtime: statSync(full).mtime })
    }
  }
  return pages
}

const pages = collectPages(clientDir)

// en page → its /zh twin (root maps to /zh/, which is how it prerenders).
const zhTwin = (p: string) => (p === '/' ? '/zh' : `/zh${p}`)
const isZh = (p: string) => p === '/zh' || p.startsWith('/zh/')
const known = new Set(pages.map((p) => p.path))

const urls = pages
  .map(({ path, mtime }) => {
    const enPath = isZh(path) ? (path === '/zh' ? '/' : path.slice(3)) : path
    const alternates = [
      { hreflang: 'en', href: appConfig.url + enPath },
      ...(known.has(zhTwin(enPath))
        ? [{ hreflang: 'zh', href: appConfig.url + zhTwin(enPath) }]
        : []),
      { hreflang: 'x-default', href: appConfig.url + enPath },
    ]
    return [
      '  <url>',
      `    <loc>${appConfig.url + path}</loc>`,
      `    <lastmod>${mtime.toISOString().slice(0, 10)}</lastmod>`,
      ...alternates.map(
        (a) =>
          `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`,
      ),
      '  </url>',
    ].join('\n')
  })
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`

writeFileSync(join(clientDir, 'sitemap.xml'), sitemap)
const robotsPath = join(clientDir, 'robots.txt')
// public/robots.txt carries the header; the rules come from the same list as
// the prerender filter. Old rule lines are dropped first so reruns are stable.
const robotsHead = readFileSync(robotsPath, 'utf-8')
  .split('\n')
  .filter((line) => !/^(Disallow|Sitemap):/.test(line))
  .join('\n')
  .trimEnd()
writeFileSync(
  robotsPath,
  [
    robotsHead,
    ...robotsDisallowLines(),
    '',
    `Sitemap: ${appConfig.url}/sitemap.xml`,
    '',
  ].join('\n'),
)
console.log(`sitemap.xml: ${pages.length} pages`)
