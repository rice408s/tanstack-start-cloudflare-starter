import { useNavigate, useSearch } from '@tanstack/react-router'
import type { DataTableQueryState } from './data-table'

/**
 * Keep a DataTable's search box, filters, page and sort in the route's search
 * params (`?q=&page=&sort=&dir=&from=&to=&<filterKey>=`) so the view is linkable and
 * survives reload. The route must `validateSearch` with `tableSearchSchema(...)`.
 * A server-driven route reads the same params in `loaderDeps` via
 * `tableListInput` (lib/list-query.ts).
 *
 *   <DataTable state={useUrlTableState()} ... />
 */
export function useUrlTableState(): DataTableQueryState {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  // Every change except paging itself starts again from page 1, in the same
  // navigation — two back-to-back navigations would race each other.
  const update = (patch: Record<string, string | number | undefined>) =>
    navigate({
      to: '.',
      replace: true,
      // biome-ignore lint/suspicious/noExplicitAny: route-agnostic merge into the current search
      search: ((prev: any) => ({ ...prev, ...patch })) as any,
    })
  const page = typeof search.page === 'number' ? search.page - 1 : 0
  const sortKey = str(search.sort)
  return {
    query: str(search.q),
    filters: Object.fromEntries(
      Object.entries(search).map(([k, v]) => [k, str(v)]),
    ),
    page: Math.max(0, page),
    sort: sortKey
      ? { key: sortKey, direction: search.dir === 'desc' ? 'desc' : 'asc' }
      : null,
    onQueryChange: (q) => update({ q: q || undefined, page: undefined }),
    onFilterChange: (key, value) => update({ [key]: value, page: undefined }),
    onFiltersChange: (patch) => update({ ...patch, page: undefined }),
    onPageChange: (p) => update({ page: p > 0 ? p + 1 : undefined }),
    onSortChange: (s) =>
      update({
        sort: s?.key,
        dir: s?.direction === 'desc' ? 'desc' : undefined,
        page: undefined,
      }),
  }
}
