import { drizzle } from 'drizzle-orm/d1'
import { getBindings } from '../server/cf'
import * as schema from './schema'

let db: ReturnType<typeof createDb> | undefined

function createDb() {
  return drizzle(getBindings().DB, { schema })
}

// Lazy so the D1 binding is only touched at request time, never during build.
export function getDb() {
  db ??= createDb()
  return db
}
