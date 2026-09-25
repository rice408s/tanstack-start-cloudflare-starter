import { z } from 'zod'

// The contract between a server-driven DataTable and the server function
// behind it. Client-safe (zod only): route loaders, components and server-fn
// validators all import it.
//
//   URL  ?q=&page=&sort=&dir=&from=&to=&<filter>=   (tableSearchSchema)
//   →    tableListInput(search)           { limit, offset, q, sort, dir, since, until }
//   →    server fn validator              listInputSchema.extend({...filters})
//   →    feature *ForApi query            one page + one count

// Console rows are 40px, so 15 rows fits under the toolbar on a laptop
// screen without scrolling; ten left the lower half of every list page
// empty and made the pager the most-used control.
export const TABLE_PAGE_SIZE = 15

// CSV export pages through the same server fn in batches; a runaway export
// stops here rather than holding a Worker for minutes.
export const EXPORT_MAX_ROWS = 10_000
const EXPORT_BATCH = 500

export const listInputSchema = z.object({
  limit: z.number().int().min(1).max(EXPORT_BATCH),
  offset: z.number().int().min(0).max(1_000_000),
  q: z.string().trim().max(200).optional(),
  // A column key the server maps to a real column; unknown keys fall back to
  // the list's default order.
  sort: z.string().max(40).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  // Created-at window, as instants. They travel as ISO strings (stable in a
  // query key) and arrive as the Dates every *ForApi query's `dateRange`
  // takes; the client decides where a day starts (tableListInput).
  since: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
  until: z.iso
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
})

// What a caller SENDS (dates as ISO strings); server fns see the parsed form.
export type ListInput = z.input<typeof listInputSchema>

export type ListPage<T> = { rows: T[]; total: number }

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * `validateSearch` for routes whose DataTable has `urlState`: `?q=` for the
 * search box, `?page=` (1-based), `?sort=&dir=`, `?from=&to=` (the date
 * filter), plus one optional string per
 * filter key (`?status=paid`). Other pages can deep-link into a table with
 * the same params.
 *
 * Here and not beside DataTable because `validateSearch` is a route OPTION,
 * and route options ship in the main bundle — importing it from
 * data-table.tsx put the whole table component on every page.
 *
 * A table with no filters calls it as `tableSearchSchema<never>()`: inside a
 * route's `validateSearch` TypeScript infers K from the expected type, gets
 * `string`, and the index signature it makes hides `q`/`page`/… .
 */
export function tableSearchSchema<K extends string = never>(
  ...filterKeys: K[]
) {
  return z.object({
    q: z.string().max(200).optional(),
    page: z.coerce.number().int().min(1).max(100_000).optional(),
    sort: z.string().max(40).optional(),
    dir: z.enum(['asc', 'desc']).optional(),
    // The created-date filter: local calendar days, inclusive.
    from: isoDay.optional(),
    to: isoDay.optional(),
    ...(Object.fromEntries(
      filterKeys.map((k) => [k, z.string().max(100).optional()]),
    ) as Record<K, z.ZodOptional<z.ZodString>>),
  })
}

export type TableSearch = {
  q?: string
  page?: number
  sort?: string
  dir?: 'asc' | 'desc'
  from?: string
  to?: string
}

/** A URL filter value, if it is one the server fn's enum accepts. */
export function pick<const T extends string>(
  allowed: readonly T[],
  value: string | undefined,
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

/** Route search params → the paging/search/sort part of a list fn's input. */
export function tableListInput(
  search: TableSearch,
  pageSize: number = TABLE_PAGE_SIZE,
): ListInput {
  const page = Math.max(1, search.page ?? 1)
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    q: search.q?.trim() || undefined,
    sort: search.sort || undefined,
    dir: search.sort ? (search.dir ?? 'asc') : undefined,
    // Parsed without a zone, so in the viewer's: "from Sep 1" starts at
    // their midnight, and "to Sep 23" takes in the whole of their 23rd.
    since: search.from
      ? new Date(`${search.from}T00:00:00`).toISOString()
      : undefined,
    until: search.to
      ? new Date(`${search.to}T23:59:59.999`).toISOString()
      : undefined,
  }
}

/**
 * Collect every row of a filtered list for export, `EXPORT_BATCH` at a time,
 * up to `EXPORT_MAX_ROWS`.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: { limit: number; offset: number }) => Promise<ListPage<T>>,
  max: number = EXPORT_MAX_ROWS,
): Promise<T[]> {
  const rows: T[] = []
  while (rows.length < max) {
    const limit = Math.min(EXPORT_BATCH, max - rows.length)
    const page = await fetchPage({ limit, offset: rows.length })
    rows.push(...page.rows)
    if (page.rows.length < limit || rows.length >= page.total) break
  }
  return rows
}
