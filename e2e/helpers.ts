import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
export const AUTH_DIR = path.join(ROOT, 'e2e/.auth')
export const USER_STATE = path.join(AUTH_DIR, 'user.json')

export const USER = {
  id: 'e2e-user',
  email: 'e2e-user@acme.test',
  name: 'E2E User',
}

// Runs SQL against the local D1 through wrangler .
export function d1(sql: string) {
  const dir = fs.mkdtempSync(path.join(ROOT, 'e2e/.auth/tmp-'))
  const file = path.join(dir, 'q.sql')
  fs.writeFileSync(file, sql)
  const res = spawnSync(
    'bunx',
    ['wrangler', 'd1', 'execute', 'DB', '--local', '--file', file],
    {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    },
  )
  fs.rmSync(dir, { recursive: true, force: true })
  if (res.status !== 0)
    throw new Error(`d1 failed:\n${res.stdout}\n${res.stderr}`)
  return res.stdout
}

export function readSecret(): string {
  const env = fs.readFileSync(path.join(ROOT, '.dev.vars'), 'utf8')
  const line = env.split('\n').find((l) => l.startsWith('BETTER_AUTH_SECRET='))
  if (!line)
    throw new Error('.dev.vars has no BETTER_AUTH_SECRET — run /setup first')
  return line
    .slice('BETTER_AUTH_SECRET='.length)
    .trim()
    .replace(/^["']|["']$/g, '')
}

// better-auth signed cookie: `<token>.<base64(HMAC-SHA256(secret, token))>`,
// URL-encoded. Same scheme as the server's setSignedCookie.
export async function signedSessionCookie(token: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(token),
  )
  const b64 = Buffer.from(sig).toString('base64')
  return encodeURIComponent(`${token}.${b64}`)
}
