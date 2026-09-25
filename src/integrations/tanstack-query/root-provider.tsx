import { QueryClient } from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Data a loader fetched (on the server during SSR, or on a hover
        // preload) counts as fresh for 30s. With React Query's default of 0
        // every hydrated useSuspenseQuery refetched on mount — the same
        // request twice per page view. Mutations invalidate what they touch;
        // queries that must never be stale set their own staleTime.
        staleTime: 30_000,
      },
    },
  })

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
