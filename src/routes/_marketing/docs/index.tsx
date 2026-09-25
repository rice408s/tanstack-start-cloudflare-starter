import { createFileRoute, redirect } from '@tanstack/react-router'
import { docs } from '@/features/content/collections'

export const Route = createFileRoute('/_marketing/docs/')({
  beforeLoad: () => {
    const first = docs[0]
    if (first) {
      throw redirect({ to: '/docs/$slug', params: { slug: first.slug } })
    }
  },
})
