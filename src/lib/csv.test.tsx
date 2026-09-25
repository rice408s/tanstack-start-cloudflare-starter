import { describe, expect, it } from 'vitest'
import { escapeCsv, toCsv } from './csv'

type Row = { name: string; n: number; when: number }
const rows: Row[] = [
  { name: 'Ada, "the" first', n: 1, when: 1000 },
  { name: '王小明', n: 2, when: 2000 },
]

describe('toCsv', () => {
  it('quotes, uses exportValue > primitive cell > sortValue, drops markup-only columns', () => {
    const csv = toCsv(rows, [
      { key: 'name', header: 'Name', cell: (r) => r.name },
      {
        key: 'n',
        header: 'N',
        cell: (r) => <b>{r.n}</b>,
        sortValue: (r) => r.n,
      },
      {
        key: 'when',
        header: 'When',
        cell: (r) => String(r.when),
        exportValue: (r) => new Date(r.when).toISOString(),
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: () => <button type="button">x</button>,
      },
    ])
    expect(csv).toBe(
      '﻿Name,N,When\r\n"Ada, ""the"" first",1,1970-01-01T00:00:01.000Z\r\n王小明,2,1970-01-01T00:00:02.000Z\r\n',
    )
  })

  it('escapeCsv leaves plain values alone', () => {
    expect(escapeCsv('plain')).toBe('plain')
    expect(escapeCsv('line\nbreak')).toBe('"line\nbreak"')
  })
})
