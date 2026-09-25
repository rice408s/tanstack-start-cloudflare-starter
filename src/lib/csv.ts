import type { ReactNode } from 'react'
import { downloadText } from './download'

export type CsvColumn<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  /** Explicit export value; falls back to a primitive `cell` result, then `sortValue`. */
  exportValue?: (row: T) => string | number | boolean | null | undefined
}

// Value a column contributes to the CSV. Columns that render only markup and
// have neither exportValue nor sortValue (e.g. action buttons) are dropped.
function cellValue<T>(column: CsvColumn<T>, row: T): string {
  if (column.exportValue) return stringify(column.exportValue(row))
  const rendered = column.cell(row)
  if (typeof rendered === 'string' || typeof rendered === 'number') {
    return String(rendered)
  }
  if (column.sortValue) return stringify(column.sortValue(row))
  return ''
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

// RFC 4180: quote when needed, double inner quotes, CRLF line ends. Prefixed
// with a BOM so Excel opens UTF-8 (non-ASCII names, CJK) correctly.
export function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv<T>(rows: Array<T>, columns: Array<CsvColumn<T>>): string {
  // Columns whose header is not a plain string fall back to their key.
  const cols = columns.filter(
    (c) =>
      c.exportValue ||
      c.sortValue ||
      rows.some((r) => {
        const v = c.cell(r)
        return typeof v === 'string' || typeof v === 'number'
      }),
  )
  const header = cols.map((c) =>
    escapeCsv(typeof c.header === 'string' ? c.header : c.key),
  )
  const lines = [header.join(',')]
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCsv(cellValue(c, row))).join(','))
  }
  return `﻿${lines.join('\r\n')}\r\n`
}

export function downloadCsv(filename: string, csv: string) {
  downloadText(
    filename.endsWith('.csv') ? filename : `${filename}.csv`,
    csv,
    'text/csv;charset=utf-8',
  )
}
