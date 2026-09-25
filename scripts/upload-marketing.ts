#!/usr/bin/env bun
/**
 * Publishes the landing page's frames to the media bucket.
 * Run: `bun run upload:marketing <dir> [--dry-run]`
 *
 * The marketing frames do NOT live in `public/` — they are content, changed
 * by whoever runs the page rather than by a deploy, so they sit in R2 under
 * a top-level `marketing/` prefix and the route reads them through
 * `appConfig.mediaUrl`. That prefix is deliberately OUTSIDE the agent
 * service's per-environment `agent-dev/` tree, which holds throwaway user
 * data and gets swept.
 *
 * The trade-off that buys: images are no longer versioned with the code.
 * Overwriting a key changes production immediately, with no review and no
 * rollback point. This script is the reproducible way in — it names every
 * key it writes, and `--dry-run` shows the full plan first.
 *
 * Source images may be anything sharp reads; each is resized to the width
 * WIDTHS gives it (DEFAULT_WIDTH otherwise) and written as webp. The fold
 * pair is larger because it holds the LCP image.
 *
 * Uploads go through wrangler, so the bucket name comes from wrangler.jsonc
 * and auth is the same one `bun run deploy` already uses — no second copy of
 * the R2 keys, and nothing to keep in sync.
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { appConfig } from '../src/config/app-config'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PREFIX = 'marketing'
const DEFAULT_WIDTH = 640
/** Frames shown larger than a wall thumbnail. Keys are file basenames. */
const WIDTHS: Record<string, number> = {
  'job-1': 900,
  'job-2': 1200,
  'w-banner': 900,
}

/** wrangler.jsonc is JSON with comments — strip them before parsing. */
function bucketName(): string {
  const raw = fs
    .readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '')
  const config = JSON.parse(raw) as {
    r2_buckets?: Array<{ binding: string; bucket_name: string }>
  }
  const bucket = config.r2_buckets?.[0]?.bucket_name
  if (!bucket) throw new Error('no r2_buckets entry in wrangler.jsonc')
  return bucket
}

const [dir, ...flags] = process.argv.slice(2)
if (!dir) {
  console.error('usage: bun run upload:marketing <dir> [--dry-run]')
  process.exit(1)
}
const dryRun = flags.includes('--dry-run')
const bucket = bucketName()

const sources = fs
  .readdirSync(dir)
  .filter((name) => /\.(png|jpe?g|webp|avif|tiff?)$/i.test(name))
  .sort()
if (sources.length === 0) {
  console.error(`no images in ${dir}`)
  process.exit(1)
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'marketing-'))
let bytes = 0
try {
  for (const name of sources) {
    const base = name.replace(/\.[^.]+$/, '')
    const width = WIDTHS[base] ?? DEFAULT_WIDTH
    const file = path.join(staging, `${base}.webp`)
    const { size } = await sharp(path.join(dir, name))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(file)
    bytes += size
    const key = `${PREFIX}/${base}.webp`
    if (!dryRun) {
      execFileSync(
        'bunx',
        [
          'wrangler',
          'r2',
          'object',
          'put',
          `${bucket}/${key}`,
          `--file=${file}`,
          '--content-type=image/webp',
          '--remote',
        ],
        { cwd: ROOT, stdio: 'pipe' },
      )
    }
    console.log(
      `${dryRun ? 'would put' : 'put'} ${appConfig.mediaUrl}/${key}  ${width}w  ${(size / 1024).toFixed(0)}KB`,
    )
  }
} finally {
  fs.rmSync(staging, { recursive: true, force: true })
}
console.log(
  `${sources.length} frames, ${(bytes / 1024).toFixed(0)}KB total${dryRun ? ' (dry run)' : ''}`,
)
