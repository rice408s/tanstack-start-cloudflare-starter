import { createFileRoute } from '@tanstack/react-router'
import { getBindings } from '@/core/server/cf'
import { avatarKey } from '@/features/auth/avatar'

// Avatars are public (they show next to the user's name in shared places)
// and the URL is versioned (?v=), so long immutable caching is safe.
export const Route = createFileRoute('/api/avatar/$userId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const object = await getBindings().BUCKET.get(avatarKey(params.userId))
        if (!object) return new Response('Not found', { status: 404 })
        return new Response(object.body, {
          headers: {
            'Content-Type':
              object.httpMetadata?.contentType ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
