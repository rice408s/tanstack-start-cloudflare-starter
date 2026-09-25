import { ArrowDown, ArrowUp, ArrowUpDown, DownloadIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { downloadCsv, toCsv } from '@/lib/csv'
import { EXPORT_MAX_ROWS, TABLE_PAGE_SIZE } from '@/lib/list-query'
import { m } from '@/paraglide/messages'
import { DateRangeFilter } from './date-range-filter'

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Value to sort by (client mode). Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number
  /**
   * Server mode: whether the header sorts. Defaults to `Boolean(sortValue)`;
   * the key is sent to the server, which ignores keys it does not map.
   */
  sortable?: boolean
  /** Value written to the CSV export. Defaults to a primitive `cell` result, then `sortValue`. */
  exportValue?: (row: T) => string | number | boolean | null | undefined
  className?: string
  headerClassName?: string
}

/** A dropdown filter condition. Add one entry per filterable column. */
export type DataTableFilter<T> = {
  key: string
  label: string
  options: Array<{ label: string; value: string }>
  /** Client mode only — in server mode the value is sent to the server fn. */
  predicate?: (row: T, value: string) => boolean
}

export type SortState = { key: string; direction: 'asc' | 'desc' } | null

const ALL = '__all__'
const SEARCH_DEBOUNCE_MS = 300

/**
 * Controlled table state (see `useUrlTableState` / `useLocalTableState`).
 * Search and filter changes are expected to reset the page themselves.
 * `page`/`sort` are required for server mode and ignored in client mode.
 */
export type DataTableQueryState = {
  query: string
  filters: Record<string, string>
  onQueryChange: (query: string) => void
  onFilterChange: (key: string, value: string | undefined) => void
  /** Several filters in one change (the date filter's `from` + `to`) — one
   * navigation, not two that race. */
  onFiltersChange?: (patch: Record<string, string | undefined>) => void
  /** 0-based. */
  page?: number
  sort?: SortState
  onPageChange?: (page: number) => void
  onSortChange?: (sort: SortState) => void
}

/** In-memory table state for a server-driven table that does not own the URL. */
export function useLocalTableState(): DataTableQueryState {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortState>(null)
  return {
    query,
    filters,
    page,
    sort,
    onQueryChange: (q) => {
      setQuery(q)
      setPage(0)
    },
    onFilterChange: (key, value) => {
      setFilters((prev) => {
        const next = { ...prev }
        if (value) next[key] = value
        else delete next[key]
        return next
      })
      setPage(0)
    },
    onFiltersChange: (patch) => {
      setFilters((prev) => {
        const next = { ...prev }
        for (const [key, value] of Object.entries(patch)) {
          if (value) next[key] = value
          else delete next[key]
        }
        return next
      })
      setPage(0)
    },
    onPageChange: setPage,
    onSortChange: (s) => {
      setSort(s)
      setPage(0)
    },
  }
}

/** Server mode: `data` is one page; search, filters, sort and paging are the server's. */
export type DataTableServer<T> = {
  /** Rows matching the current search + filters, across all pages. */
  total: number
  /** Dims the table while a new page is loading. */
  isFetching?: boolean
  /** Every row matching the current search + filters, for the CSV export. */
  exportRows?: () => Promise<Array<T>>
}

const nextSort = (prev: SortState, key: string): SortState => {
  if (prev?.key !== key) return { key, direction: 'asc' }
  if (prev.direction === 'asc') return { key, direction: 'desc' }
  return null
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  search,
  searchPlaceholder,
  filters,
  dateFilter,
  pageSize = TABLE_PAGE_SIZE,
  emptyMessage,
  exportName,
  state,
  server,
  onRowClick,
}: {
  data: Array<T>
  columns: Array<DataTableColumn<T>>
  getRowId: (row: T) => string
  /**
   * Client mode: the text a row should match against the search box.
   * Server mode: `true`. Omit to hide the search box.
   */
  search?: ((row: T) => string) | true
  searchPlaceholder?: string
  /** Dropdown filter conditions, rendered next to the search box. */
  filters?: Array<DataTableFilter<T>>
  /** A created-date filter (`from`/`to` in the state, local days). Server
   * mode with controlled state only: the server fn applies it through
   * `tableListInput` → `since`/`until`. Pass the label, or `true` for "Date". */
  dateFilter?: boolean | string
  pageSize?: number
  emptyMessage?: ReactNode
  /** File name (without .csv) for the export button; omit to hide it. Exports the searched/filtered/sorted rows. */
  exportName?: string
  /** Make search + filters (and, in server mode, page + sort) controlled. */
  state?: DataTableQueryState
  /** Switch to server mode; `state` should carry page/sort handlers. */
  server?: DataTableServer<T>
  /**
   * Makes every row a target (typically: open the detail page). Clicks that
   * land on a control inside the row — a button, link, menu — are left to
   * that control.
   */
  onRowClick?: (row: T) => void
}) {
  const [localQuery, setLocalQuery] = useState('')
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({})
  const query = state ? state.query : localQuery
  const activeFilters = state ? state.filters : localFilters
  const setQuery = state ? state.onQueryChange : setLocalQuery
  const [localSort, setLocalSort] = useState<SortState>(null)
  const [localPage, setLocalPage] = useState(0)
  const controlledPaging = Boolean(server && state?.onPageChange)
  const sort = controlledPaging ? (state?.sort ?? null) : localSort
  const page = controlledPaging ? (state?.page ?? 0) : localPage
  const setPage = (p: number) => {
    if (controlledPaging) state?.onPageChange?.(p)
    else setLocalPage(p)
  }

  // Server mode debounces the search box so a query goes out per pause, not
  // per keystroke. `sent` is the last value handed up, so a URL that catches
  // up to it later does not overwrite what has been typed since.
  const [draft, setDraft] = useState(query)
  const sent = useRef(query)
  const setQueryRef = useRef(setQuery)
  setQueryRef.current = setQuery
  useEffect(() => {
    if (query !== sent.current) {
      sent.current = query
      setDraft(query)
    }
  }, [query])
  useEffect(() => {
    if (!server || draft === sent.current) return
    const timer = setTimeout(() => {
      sent.current = draft
      setQueryRef.current(draft)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, server])

  const searchFn = typeof search === 'function' ? search : undefined
  const searched = useMemo(() => {
    if (server || !searchFn || !query.trim()) return data
    const needle = query.trim().toLowerCase()
    return data.filter((row) => searchFn(row).toLowerCase().includes(needle))
  }, [data, searchFn, query, server])

  const filtered = useMemo(() => {
    if (server || !filters?.length) return searched
    return searched.filter((row) =>
      filters.every((filter) => {
        const value = activeFilters[filter.key]
        if (!value || value === ALL || !filter.predicate) return true
        return filter.predicate(row, value)
      }),
    )
  }, [searched, filters, activeFilters, server])

  const sorted = useMemo(() => {
    if (server || !sort) return filtered
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return filtered
    const dir = sort.direction === 'asc' ? 1 : -1
    const sortValue = column.sortValue
    return [...filtered].sort((a, b) => {
      const va = sortValue(a)
      const vb = sortValue(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [filtered, sort, columns, server])

  const total = server ? server.total : sorted.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const paged = server
    ? data
    : sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  // A server page past the end (a deep link, or rows deleted meanwhile) snaps
  // back to the last page that exists.
  const serverFetching = server?.isFetching
  useEffect(() => {
    if (server && !serverFetching && page > pageCount - 1) {
      setPage(pageCount - 1)
    }
  })

  const isSortable = (column: DataTableColumn<T>) =>
    server ? (column.sortable ?? Boolean(column.sortValue)) : !!column.sortValue

  const toggleSort = (key: string) => {
    const next = nextSort(sort, key)
    if (controlledPaging) {
      state?.onSortChange?.(next)
    } else {
      setLocalPage(0)
      setLocalSort(next)
    }
  }

  const goToPage = (input: number) => {
    if (Number.isNaN(input)) return
    setPage(Math.min(Math.max(input - 1, 0), pageCount - 1))
  }

  const [pageInput, setPageInput] = useState(String(currentPage + 1))
  useEffect(() => {
    setPageInput(String(currentPage + 1))
  }, [currentPage])

  const commitPageInput = () => {
    const parsed = Number(pageInput)
    if (pageInput.trim() && !Number.isNaN(parsed)) {
      goToPage(parsed)
    } else {
      setPageInput(String(currentPage + 1))
    }
  }

  // A download of everyone's rows is not a thing to do by a misclick on an
  // unlabelled icon, so the icon asks first.
  const [confirmExport, setConfirmExport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportCount = server ? Math.min(total, EXPORT_MAX_ROWS) : sorted.length
  const runExport = async () => {
    const filename = `${exportName}-${new Date().toISOString().slice(0, 10)}`
    if (!server) {
      downloadCsv(filename, toCsv(sorted, columns))
      return
    }
    setExporting(true)
    try {
      const rows = server.exportRows ? await server.exportRows() : data
      downloadCsv(filename, toCsv(rows, columns))
    } finally {
      setExporting(false)
    }
  }

  // A click on a control inside the row belongs to that control.
  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest(
      'a, button, input, select, textarea, [role=menu], [role=menuitem], [data-slot=select-trigger]',
    ) !== null

  return (
    <div className="flex flex-col gap-3">
      {(search || filters?.length || dateFilter || exportName) && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <Input
              value={server ? draft : query}
              onChange={(e) => {
                if (server) {
                  setDraft(e.target.value)
                  return
                }
                setLocalPage(0)
                setQuery(e.target.value)
              }}
              placeholder={searchPlaceholder ?? m.table_search_placeholder()}
              className="h-8 max-w-64 focus-visible:border-input focus-visible:ring-0"
            />
          )}
          {filters?.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || ALL}
              onValueChange={(value) => {
                if (!controlledPaging) setLocalPage(0)
                if (state) {
                  state.onFilterChange(
                    filter.key,
                    value === ALL ? undefined : value,
                  )
                } else {
                  setLocalFilters((prev) => ({ ...prev, [filter.key]: value }))
                }
              }}
            >
              <SelectTrigger size="sm" className="min-w-32">
                <span className="text-muted-foreground">{filter.label}</span>
                <SelectValue placeholder={m.table_filter_all()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{m.table_filter_all()}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {dateFilter && state && (
            <DateRangeFilter
              label={
                typeof dateFilter === 'string'
                  ? dateFilter
                  : m.table_filter_date()
              }
              value={{
                from: activeFilters.from || undefined,
                to: activeFilters.to || undefined,
              }}
              onChange={(range) => {
                const patch = { from: range.from, to: range.to }
                if (state.onFiltersChange) state.onFiltersChange(patch)
                else {
                  state.onFilterChange('from', patch.from)
                  state.onFilterChange('to', patch.to)
                }
              }}
            />
          )}
          {/* Export is rare, so it is an icon at the far right rather than a
              labelled button; the label and the row count are its tooltip.
              The count itself is not shown — the pager says how many pages,
              and the intro line above most tables already gives the total. */}
          {exportName && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={exportCount === 0 || exporting}
              onClick={() => setConfirmExport(true)}
              title={m.table_export_csv({ count: exportCount })}
              className="ml-auto"
            >
              <DownloadIcon />
              <span className="sr-only">
                {m.table_export_csv({ count: exportCount })}
              </span>
            </Button>
          )}
          {exportName && (
            <ConfirmDialog
              open={confirmExport}
              onOpenChange={setConfirmExport}
              title={m.table_export_confirm_title()}
              description={m.table_export_confirm_body({ count: exportCount })}
              confirmLabel={m.table_export_confirm()}
              cancelLabel={m.settings_cancel()}
              variant="default"
              onConfirm={() => {
                setConfirmExport(false)
                void runExport()
              }}
            />
          )}
        </div>
      )}

      {total === 0 || paged.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage ?? m.table_no_results()}
        </p>
      ) : (
        <>
          <Table
            aria-busy={serverFetching || undefined}
            className={
              serverFetching ? 'opacity-60 transition-opacity' : undefined
            }
          >
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.headerClassName}
                  >
                    {isSortable(column) ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                      >
                        {column.header}
                        {sort?.key === column.key ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={
                    onRowClick
                      ? (e) => {
                          if (!isInteractive(e.target)) onRowClick(row)
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{m.table_go_to_page()}</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  onChange={(e) =>
                    setPageInput(e.target.value.replace(/\D/g, ''))
                  }
                  onBlur={commitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitPageInput()
                    }
                  }}
                  className="h-7 w-11 text-center text-xs"
                />
                <span>{m.table_page_count({ total: pageCount })}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  {m.table_prev()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  {m.table_next()}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
