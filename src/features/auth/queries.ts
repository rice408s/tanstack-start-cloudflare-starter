import { queryOptions } from '@tanstack/react-query'
import { getAuthProvidersFn, getSessionFn } from './server/fns'

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: () => getSessionFn(),
  staleTime: 60_000,
})

// Rarely changes and costs a round trip on a page the visitor is about to
// leave, so it is cached for the session rather than refetched per mount.
export const authProvidersQuery = queryOptions({
  queryKey: ['auth', 'providers'],
  queryFn: () => getAuthProvidersFn(),
  staleTime: Number.POSITIVE_INFINITY,
})
