import fs from 'node:fs'
import { AUTH_DIR, d1, USER } from './helpers'

export default async function globalTeardown() {
  d1(`DELETE FROM session WHERE user_id='${USER.id}';`)
  d1(`DELETE FROM user WHERE id='${USER.id}';`)
  fs.rmSync(AUTH_DIR, { recursive: true, force: true })
}
