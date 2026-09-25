import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import {
  AUTH_DIR,
  d1,
  ROOT,
  readSecret,
  signedSessionCookie,
  USER,
  USER_STATE,
} from './helpers'

const q = (v: string) => `'${v.replaceAll("'", "''")}'`

// Applies migrations, then forges one signed-in user so no test needs a real
// sign-in. See e2e/README.md.
export default async function globalSetup() {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true })
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const res = spawnSync('bun', ['run', 'db:migrate:local'], {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
  })
  if (res.status !== 0)
    throw new Error(`db:migrate:local failed:\n${res.stdout}\n${res.stderr}`)

  const now = Date.now()
  const week = 7 * 86_400_000
  const token = `e2e-${USER.id}-${crypto.randomUUID()}`
  d1(
    [
      `INSERT OR REPLACE INTO user (id,name,email,email_verified,created_at,updated_at,locale) VALUES (${q(USER.id)},${q(USER.name)},${q(USER.email)},1,${now},${now},'en');`,
      `DELETE FROM session WHERE user_id=${q(USER.id)};`,
      // Full-length session so no request triggers a refresh (updateAge).
      `INSERT INTO session (id,token,user_id,expires_at,created_at,updated_at) VALUES (${q(`sess-${USER.id}`)},${q(token)},${q(USER.id)},${now + week},${now},${now});`,
    ].join('\n'),
  )

  const value = await signedSessionCookie(token, readSecret())
  fs.writeFileSync(
    USER_STATE,
    JSON.stringify({
      cookies: [
        {
          name: 'better-auth.session_token',
          value,
          domain: 'localhost',
          path: '/',
          expires: Math.floor((now + week) / 1000),
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  )
}
