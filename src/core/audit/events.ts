// Audit trail, same registry shape as core/payment and core/stats: any server
// code calls `audit(entry)`; features that want to persist or forward entries
// register a sink. With no sink registered (audit feature deleted) it is a
// no-op, so callers never need to know whether auditing exists.
//
// Entries are facts about who did what to which thing — never secrets
// (tokens, keys) and never request bodies wholesale. `meta` is for the few
// fields that make the row useful on its own (role, plan, file name…).

export type AuditEntry = {
  // Dotted `<area>.<verb>` — e.g. `auth.sign_in`, `admin.role_set`.
  action: string
  // Who did it. Both null = system (webhook, cron).
  actorId?: string | null
  actorEmail?: string | null
  // What it was done to; e.g. ('user', id) or ('subscription', externalId).
  targetType?: string | null
  targetId?: string | null
  meta?: Record<string, string | number | boolean | null> | null
  ip?: string | null
  userAgent?: string | null
}

type Sink = (entry: AuditEntry) => Promise<void>

const sinks: Sink[] = []

export function onAudit(sink: Sink) {
  sinks.push(sink)
}

// Unlike payment/stats, audit is dispatched from many entry points (auth
// hooks, webhook, server fns), so the registry loads itself on first use
// instead of every caller importing ./handlers. Lazy also avoids the import
// cycle handlers → sink → onAudit while this module is still initializing.
let handlersLoaded: Promise<unknown> | undefined

// Best-effort by design: an audit failure must never fail the action it
// describes (a sign-in that works but can't be logged is still a sign-in).
export async function audit(entry: AuditEntry): Promise<void> {
  handlersLoaded ??= import('./handlers').catch((err) => {
    console.error('[audit] failed to load sinks', err)
  })
  await handlersLoaded
  for (const sink of sinks) {
    try {
      await sink(entry)
    } catch (err) {
      console.error('[audit] sink failed', entry.action, err)
    }
  }
}

// Request-derived fields, shared by every call site that has a Request.
export function requestMeta(headers: Headers | undefined | null) {
  if (!headers) return {}
  return {
    ip:
      headers.get('cf-connecting-ip') ??
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null,
    userAgent: headers.get('user-agent')?.slice(0, 255) ?? null,
  }
}
