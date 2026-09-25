import { createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { audit, requestMeta } from '@/core/audit/events'

// Maps better-auth endpoints to audit entries. Runs as `hooks.after`, i.e.
// once per HTTP call to /api/auth/* (direct `auth.api.*` calls skip hooks —
// verifyApiKey on the admin data API is deliberately not audited).
// Only successful calls are recorded: a failed ban attempt is not an event.
type Ctx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]

function bodyStr(ctx: Ctx, key: string): string | null {
  const v = (ctx.body as Record<string, unknown> | undefined)?.[key]
  return typeof v === 'string' ? v : null
}

function returnedRecord(ctx: Ctx): Record<string, unknown> {
  const r = ctx.context.returned
  return r && typeof r === 'object' && !(r instanceof Error)
    ? (r as Record<string, unknown>)
    : {}
}

// Sign-out deletes the session before any after-hook runs, so resolve it up
// front; getSessionFromCtx caches on ctx.context.session for the after-hook.
export const auditBeforeHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === '/sign-out') {
    await getSessionFromCtx(ctx).catch(() => null)
  }
})

export const auditAfterHook = createAuthMiddleware(async (ctx) => {
  // APIError in `returned` = the endpoint failed; nothing to record.
  if (ctx.context.returned instanceof Error) return

  const req = requestMeta(ctx.headers ?? ctx.request?.headers)

  // Any endpoint that established a session (Google callback, One Tap).
  // A daily session refresh (get-session, updateAge) also sets newSession
  // with the same cookie — only a session row created just now is a sign-in.
  const fresh = ctx.context.newSession
  if (
    fresh &&
    Date.now() - new Date(fresh.session.createdAt).getTime() < 60_000
  ) {
    await audit({
      action: 'auth.sign_in',
      actorId: fresh.user.id,
      actorEmail: fresh.user.email,
      meta: { method: ctx.path.replace(/^\//, '') },
      ...req,
    })
    return
  }

  const path = ctx.path
  if (path === '/sign-out') {
    // Cached by auditBeforeHook before the row was deleted.
    const s = ctx.context.session
    await audit({
      action: 'auth.sign_out',
      actorId: s?.user.id ?? null,
      actorEmail: s?.user.email ?? null,
      ...req,
    })
    return
  }
  if (path === '/delete-user' || path === '/delete-user/callback') {
    // No email snapshot: the account is gone and the row must not keep PII.
    await audit({ action: 'auth.account_deleted', ...req })
    return
  }

  // Everything below has an authenticated actor.
  const session = ctx.context.session ?? (await getSessionFromCtx(ctx))
  if (!session) return
  const actor = {
    actorId: session.user.id,
    actorEmail: session.user.email,
    ...req,
  }
  const returned = returnedRecord(ctx)

  switch (path) {
    case '/update-user':
      await audit({
        ...actor,
        action: 'auth.profile_updated',
        targetType: 'user',
        targetId: session.user.id,
      })
      return
    case '/admin/set-role':
      await audit({
        ...actor,
        action: 'admin.role_set',
        targetType: 'user',
        targetId: bodyStr(ctx, 'userId'),
        meta: { role: bodyStr(ctx, 'role') },
      })
      return
    case '/admin/ban-user':
      await audit({
        ...actor,
        action: 'admin.user_banned',
        targetType: 'user',
        targetId: bodyStr(ctx, 'userId'),
        meta: { reason: bodyStr(ctx, 'banReason') },
      })
      return
    case '/admin/unban-user':
      await audit({
        ...actor,
        action: 'admin.user_unbanned',
        targetType: 'user',
        targetId: bodyStr(ctx, 'userId'),
      })
      return
    case '/api-key/create': {
      const key = returned as { id?: string; name?: string; start?: string }
      await audit({
        ...actor,
        action: 'api_key.created',
        targetType: 'api_key',
        targetId: key.id ?? null,
        meta: { name: key.name ?? null, start: key.start ?? null },
      })
      return
    }
    case '/api-key/delete':
      await audit({
        ...actor,
        action: 'api_key.deleted',
        targetType: 'api_key',
        targetId: bodyStr(ctx, 'keyId'),
      })
      return
  }
})
