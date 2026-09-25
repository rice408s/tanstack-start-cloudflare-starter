#!/usr/bin/env bun
/**
 * Renders scripts/og-card.html to public/og.png at exactly 1200x630 — the
 * social card behind og:image / twitter:image in src/routes/__root.tsx.
 *
 *   bun run og
 *
 * The output is COMMITTED, like public/marketing/: a clone has to look right
 * before its owner has a bucket or a build step. Uses the project's own
 * Playwright, so the browser build matches the one e2e already downloads.
 *
 * After re-rendering, bump `v` on `socialCard` in __root.tsx — X and the
 * other crawlers cache a card by its URL for about a week, so a redraw at
 * the same URL keeps showing the old picture.
 */
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CARD = path.join(ROOT, 'scripts/og-card.html')
const OUT = path.join(ROOT, 'public/og.png')

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
})
await page.goto(`file://${CARD}`)
// The faces are font-display:block and loaded from disk; without this the
// shot can land on the fallback stack for the slogan.
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUT })
await browser.close()
console.log('wrote public/og.png')
