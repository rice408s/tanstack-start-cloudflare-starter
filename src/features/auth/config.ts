/**
 * Auth defaults. Client-safe by construction — see the note in
 * features/billing/config.ts for why that matters.
 */

/**
 * How long a deleted account is kept before it is erased for good. During the
 * window the account cannot sign in and its keys are dead, but every row is
 * still there: support can trace what happened, and an operator can restore
 * it.
 */
export const ACCOUNT_RETENTION_DAYS = 30
