import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { audit, requestMeta } from '@/core/audit/events'
import { getDb } from '@/core/db'
import { getBindings } from '@/core/server/cf'
import { isRateLimited, tooManyRequests } from '@/core/server/rate-limit'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  avatarKey,
  avatarUrl,
} from '@/features/auth/avatar'
import { user } from '@/features/auth/schema'
import { getAuth } from '@/features/auth/server/auth'

// Account dialog → photo. Multipart POST with a single "file" field
// replaces the current avatar — there is no removal, only replacement.
export const Route = createFileRoute('/api/avatar')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getAuth().api.getSession({
          headers: request.headers,
        })
        if (!session) return new Response('Unauthorized', { status: 401 })
        // A session is not a budget: every POST here is an R2 write plus a
        // row update, and nothing else caps how often one account can fire
        // them. Throttled after the session check so an anonymous flood
        // cannot burn a real user's quota.
        if (await isRateLimited('avatar', { headers: request.headers })) {
          return tooManyRequests()
        }
        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) {
          return new Response('Missing file', { status: 400 })
        }
        if (!AVATAR_TYPES.includes(file.type)) {
          return new Response('Unsupported type', { status: 415 })
        }
        if (file.size > AVATAR_MAX_BYTES) {
          return new Response('File too large', { status: 413 })
        }
        const version = Date.now()
        await getBindings().BUCKET.put(
          avatarKey(session.user.id),
          file.stream(),
          {
            httpMetadata: {
              contentType: file.type,
              cacheControl: 'public, max-age=31536000, immutable',
            },
          },
        )
        const image = avatarUrl(session.user.id, version)
        await getDb()
          .update(user)
          .set({ image, updatedAt: new Date() })
          .where(eq(user.id, session.user.id))
        await audit({
          action: 'auth.profile_updated',
          actorId: session.user.id,
          actorEmail: session.user.email,
          targetType: 'user',
          targetId: session.user.id,
          meta: { field: 'image', size: file.size },
          ...requestMeta(request.headers),
        })
        return Response.json({ image })
      },
    },
  },
})
