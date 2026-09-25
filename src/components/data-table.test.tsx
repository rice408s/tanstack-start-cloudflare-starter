import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQueryState,
} from './data-table'

interface Row {
  id: string
  name: string
  role: 'user' | 'admin'
  joined: number
}

const columns: Array<DataTableColumn<Row>> = [
  {
    key: 'name',
    header: 'Name',
    sortValue: (r) => r.name,
    cell: (r) => r.name,
  },
  { key: 'role', header: 'Role', cell: (r) => r.role },
  {
    key: 'joined',
    header: 'Joined',
    sortValue: (r) => r.joined,
    cell: (r) => String(r.joined),
  },
]

const filters: Array<DataTableFilter<Row>> = [
  {
    key: 'role',
    label: 'Role filter',
    options: [
      { label: 'User', value: 'user' },
      { label: 'Admin', value: 'admin' },
    ],
    predicate: (r, value) => r.role === value,
  },
]

function makeRows(count: number): Array<Row> {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `User ${String(i).padStart(2, '0')}`,
    role: i % 5 === 0 ? 'admin' : 'user',
    joined: i,
  }))
}

describe('DataTable search', () => {
  it('filters rows by the search predicate, case-insensitively', () => {
    const rows = makeRows(5)
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        search={(r) => r.name}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Search…'), {
      target: { value: 'user 03' },
    })

    expect(screen.getByText('User 03')).toBeTruthy()
    expect(screen.queryByText('User 01')).toBeNull()
  })
})

describe('DataTable sorting', () => {
  it('cycles asc -> desc -> unsorted on repeated header clicks', () => {
    const rows = makeRows(3)
    render(<DataTable data={rows} columns={columns} getRowId={(r) => r.id} />)

    const getBodyRows = () => screen.getAllByRole('row').slice(1) // skip header row

    // Natural (insertion) order first.
    expect(within(getBodyRows()[0]).getByText('User 00')).toBeTruthy()

    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader) // asc
    expect(within(getBodyRows()[0]).getByText('User 00')).toBeTruthy()

    fireEvent.click(nameHeader) // desc
    expect(within(getBodyRows()[0]).getByText('User 02')).toBeTruthy()

    fireEvent.click(nameHeader) // back to unsorted / original order
    expect(within(getBodyRows()[0]).getByText('User 00')).toBeTruthy()
  })
})

describe('DataTable filters', () => {
  it('applies a dropdown filter predicate', () => {
    const rows = makeRows(10) // admins at index 0 and 5
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        filters={filters}
      />,
    )

    // The filter select shows "All" (m.table_filter_all()) until a value is
    // chosen — the filter's own label is only the placeholder text, which
    // Radix Select never renders once a value (even the ALL sentinel) is set.
    fireEvent.click(screen.getByText('All'))
    fireEvent.click(screen.getByText('Admin'))

    expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 admins
  })
})

describe('DataTable pagination', () => {
  it('paginates and supports jump-to-page', () => {
    const rows = makeRows(25)
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
      />,
    )

    // Page 1 of 3 by default.
    expect(screen.getByText('User 00')).toBeTruthy()
    expect(screen.queryByText('User 10')).toBeNull()

    const pageInput = screen.getByDisplayValue('1')
    fireEvent.change(pageInput, { target: { value: '3' } })
    fireEvent.blur(pageInput)

    expect(screen.getByText('User 20')).toBeTruthy()
    expect(screen.queryByText('User 00')).toBeNull()
  })

  it('clamps an out-of-range page-jump to the last page instead of erroring', () => {
    const rows = makeRows(25)
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
      />,
    )

    const pageInput = screen.getByDisplayValue('1')
    fireEvent.change(pageInput, { target: { value: '999' } })
    fireEvent.blur(pageInput)

    expect(screen.getByText('User 24')).toBeTruthy()
    expect((pageInput as HTMLInputElement).value).toBe('3')
  })

  it('resets an invalid page-jump input back to the current page', () => {
    const rows = makeRows(25)
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
      />,
    )

    const pageInput = screen.getByDisplayValue('1')
    fireEvent.change(pageInput, { target: { value: '' } })
    fireEvent.blur(pageInput)

    expect((pageInput as HTMLInputElement).value).toBe('1')
    expect(screen.getByText('User 00')).toBeTruthy()
  })
})

describe('DataTable empty state', () => {
  it('shows the empty message when there are no rows', () => {
    render(<DataTable data={[]} columns={columns} getRowId={(r) => r.id} />)
    expect(screen.getByText('No results.')).toBeTruthy()
  })
})

describe('DataTable server mode', () => {
  const pageState = (overrides: Partial<DataTableQueryState> = {}) => ({
    query: '',
    filters: {},
    onQueryChange: vi.fn(),
    onFilterChange: vi.fn(),
    page: 0,
    sort: null,
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    ...overrides,
  })

  it('renders the given page as-is and pages by the server total', () => {
    const state = pageState()
    render(
      <DataTable
        data={makeRows(10)}
        columns={columns}
        getRowId={(r) => r.id}
        state={state}
        pageSize={10}
        server={{ total: 25 }}
      />,
    )
    expect(screen.getAllByRole('row')).toHaveLength(11)
    expect(screen.getByText('of 3')).toBeTruthy()
    fireEvent.click(screen.getByText('Next'))
    expect(state.onPageChange).toHaveBeenCalledWith(1)
  })

  it('hands sort changes to the state instead of sorting locally', () => {
    const state = pageState()
    render(
      <DataTable
        data={makeRows(3)}
        columns={columns}
        getRowId={(r) => r.id}
        state={state}
        server={{ total: 3 }}
      />,
    )
    fireEvent.click(screen.getByText('Name'))
    expect(state.onSortChange).toHaveBeenCalledWith({
      key: 'name',
      direction: 'asc',
    })
  })

  it('debounces the search box', () => {
    vi.useFakeTimers()
    try {
      const state = pageState()
      render(
        <DataTable
          data={makeRows(3)}
          columns={columns}
          getRowId={(r) => r.id}
          state={state}
          search
          server={{ total: 3 }}
        />,
      )
      fireEvent.change(screen.getByPlaceholderText('Search…'), {
        target: { value: 'user 01' },
      })
      expect(state.onQueryChange).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(state.onQueryChange).toHaveBeenCalledWith('user 01')
    } finally {
      vi.useRealTimers()
    }
  })
})
