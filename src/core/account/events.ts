import { APIError } from 'better-auth/api'

// Account-lifecycle hooks, mirroring core/payment/events: features register
// what must happen around a user deleting their account, and auth.ts calls
// dispatch. DB rows cascade on user delete; these hooks are for everything
// that doesn't — external objects (R2), and guards that should block.
// `onAccountExport` is the read-side twin: each feature contributes its
// slice of "download my data" (Settings → Your data).

export type AccountRef = { id: string; email: string }

type Handler = (user: AccountRef) => Promise<void>

/**
 * Created-handlers additionally receive the signup request's headers, when
 * the caller has them. Anything that has to know HOW someone arrived — a
 * referral cookie, a locale, a campaign — can only learn it here: by the
 * time any later hook runs, the request is gone.
 */
type CreatedHandler = (user: AccountRef, headers?: Headers) => Promise<void>

const createdHandlers: CreatedHandler[] = []
const guardHandlers: Handler[] = []
const beforeHandlers: Handler[] = []
const afterHandlers: Handler[] = []

// Runs once, right after the user row exists. For the work a new account
// needs before it can do anything — currently the free plan's first credit
// grant. Best-effort: it must never block the sign-in redirect, so auth.ts
// swallows failures and the monthly job picks up whatever was missed.
export function onAccountCreated(handler: CreatedHandler) {
  createdHandlers.push(handler)
}

// Deleting an account is two moments, not one. When the user asks, the
// account is only CLOSED: stamped `deletedAt`, signed out, keys revoked, and
// every row kept for a retention window (auth.deleted_account_retention_days)
// so support can trace what happened and an operator can restore it. When the
// window passes, the purge job ERASES it. Guards run at the first moment;
// cleanup and the after-hooks only at the second.

// Runs when a user asks to delete their account, before anything changes —
// and again at purge, in case something opened since. Throw
// `blockAccountDeletion(code)` to refuse; the code reaches the client as the
// error message. Checks only: nothing destructive belongs here, because the
// account survives the retention window.
export function onAccountDeletionGuard(handler: Handler) {
  guardHandlers.push(handler)
}

// Runs at purge, before the user row is deleted: external cleanup (R2
// objects) that needs the rows to still name the keys.
export function onBeforeAccountDelete(handler: Handler) {
  beforeHandlers.push(handler)
}

// Runs at purge, after the user row (and cascades) are gone.
export function onAccountDeleted(handler: Handler) {
  afterHandlers.push(handler)
}

export function blockAccountDeletion(code: 'ACTIVE_SUBSCRIPTION') {
  return new APIError('BAD_REQUEST', { message: code, code })
}

type ExportHandler = (user: AccountRef) => Promise<unknown>
const exportHandlers = new Map<string, ExportHandler>()

// Register the feature's personal data under `key` in the export JSON.
// Keyed so a module re-run (dev HMR) replaces, never duplicates.
export function onAccountExport(key: string, handler: ExportHandler) {
  exportHandlers.set(key, handler)
}

export async function collectAccountExport(user: AccountRef) {
  const out: Record<string, unknown> = {}
  for (const [key, handler] of exportHandlers) out[key] = await handler(user)
  return out
}

export async function dispatchAccountCreated(
  user: AccountRef,
  headers?: Headers,
) {
  for (const handler of createdHandlers) await handler(user, headers)
}

export async function dispatchAccountDeletionGuards(user: AccountRef) {
  for (const handler of guardHandlers) await handler(user)
}

export async function dispatchBeforeAccountDelete(user: AccountRef) {
  for (const handler of beforeHandlers) await handler(user)
}

export async function dispatchAccountDeleted(user: AccountRef) {
  for (const handler of afterHandlers) await handler(user)
}
