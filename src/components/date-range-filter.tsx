import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

// A created-date range picker for a list toolbar, in the shape every admin
// console uses: the trigger reads "start → end", the panel has shortcuts on
// the left and two months side by side — click the first day, then the last.
// Values are local calendar days (YYYY-MM-DD, inclusive); `tableListInput`
// turns them into the instants the server filters on, so "today" is the
// viewer's today. No date library: a month grid is a few lines of arithmetic.

export type DayRange = { from?: string; to?: string }

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseDay = (s: string) => new Date(`${s}T00:00:00`)
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1)

function shortcuts(): Array<{ key: string; label: string; range: DayRange }> {
  const today = new Date()
  const ago = (n: number) =>
    dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n))
  const t = dayKey(today)
  return [
    { key: 'today', label: m.table_date_today(), range: { from: t, to: t } },
    {
      key: '7',
      label: m.table_date_last_days({ days: 7 }),
      range: { from: ago(6), to: t },
    },
    {
      key: '30',
      label: m.table_date_last_days({ days: 30 }),
      range: { from: ago(29), to: t },
    },
    {
      key: '90',
      label: m.table_date_last_days({ days: 90 }),
      range: { from: ago(89), to: t },
    },
    {
      key: 'month',
      label: m.table_date_this_month(),
      range: { from: dayKey(addMonths(today, 0)), to: t },
    },
    {
      key: 'last-month',
      label: m.table_date_last_month(),
      range: {
        from: dayKey(addMonths(today, -1)),
        to: dayKey(new Date(today.getFullYear(), today.getMonth(), 0)),
      },
    },
  ]
}

export function DateRangeFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: DayRange
  onChange: (next: DayRange) => void
}) {
  const [open, setOpen] = useState(false)
  // The right-hand month; the left one is the month before it.
  const [month, setMonth] = useState(() => new Date())
  // First click of a pick in progress, and the day under the pointer — the
  // two ends of the range drawn while choosing the second day.
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const active = Boolean(value.from || value.to)

  const commit = (next: DayRange) => {
    onChange(next)
    setOpen(false)
  }
  const clickDay = (day: string) => {
    if (!anchor) {
      setAnchor(day)
      return
    }
    commit(
      anchor <= day ? { from: anchor, to: day } : { from: day, to: anchor },
    )
  }

  // What the grid shows as selected: the pick in progress, else the value.
  const [lo, hi] = anchor
    ? [anchor, hover ?? anchor].sort()
    : [value.from, value.to ?? value.from]

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setAnchor(null)
          setHover(null)
          setMonth(value.to ? parseDay(value.to) : new Date())
        }
        setOpen(next)
      }}
    >
      <div className="relative">
        <PopoverTrigger asChild>
          {/* Dressed as the toolbar's select triggers, so the filters read
              as one row of the same control. */}
          <button
            type="button"
            aria-label={label}
            className="flex h-8 w-fit items-center gap-2 rounded-md border border-input bg-background pr-8 pl-3 text-sm whitespace-nowrap tabular-nums outline-none focus-visible:border-ring dark:bg-input/30 dark:hover:bg-input/50"
          >
            <CalendarIcon
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            <span className={value.from ? '' : 'text-muted-foreground'}>
              {value.from ?? m.table_date_from()}
            </span>
            <ArrowRightIcon
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
            <span className={value.to ? '' : 'text-muted-foreground'}>
              {value.to ?? m.table_date_to()}
            </span>
          </button>
        </PopoverTrigger>
        {active && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-3.5" aria-hidden />
            <span className="sr-only">{m.table_date_clear()}</span>
          </button>
        )}
      </div>
      <PopoverContent align="start" className="flex w-auto gap-0 p-0">
        <ul className="flex w-28 shrink-0 flex-col gap-0.5 border-r p-2 max-sm:hidden">
          {shortcuts().map((s) => {
            const selected =
              s.range.from === value.from && s.range.to === value.to
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => commit(s.range)}
                  className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent ${
                    selected ? 'font-semibold' : ''
                  }`}
                >
                  {s.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex gap-6 p-3">
          {[addMonths(month, -1), addMonths(month, 0)].map((first, i) => (
            <MonthGrid
              key={dayKey(first)}
              first={first}
              lo={lo}
              hi={hi}
              onPrev={
                i === 0 ? () => setMonth((d) => addMonths(d, -1)) : undefined
              }
              onNext={
                i === 1 ? () => setMonth((d) => addMonths(d, 1)) : undefined
              }
              onDay={clickDay}
              onHover={anchor ? setHover : undefined}
              className={i === 0 ? 'max-sm:hidden' : ''}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MonthGrid({
  first,
  lo,
  hi,
  onPrev,
  onNext,
  onDay,
  onHover,
  className = '',
}: {
  first: Date
  lo?: string
  hi?: string
  onPrev?: () => void
  onNext?: () => void
  onDay: (day: string) => void
  onHover?: (day: string | null) => void
  className?: string
}) {
  const locale = getLocale()
  // Weeks start on Monday except in English, where Sunday is the habit.
  const weekStart = locale.startsWith('en') ? 0 : 1
  const title = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(first)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
  const today = dayKey(new Date())
  const lead = (first.getDay() - weekStart + 7) % 7
  const length = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate()
  const blanks = Array.from({ length: lead }, (_, n) => `blank-${n}`)
  const days = Array.from({ length }, (_, n) =>
    dayKey(new Date(first.getFullYear(), first.getMonth(), n + 1)),
  )
  // Day-of-week numbers in column order; 2023-01-01 was a Sunday.
  const columns = Array.from({ length: 7 }, (_, n) => (n + weekStart) % 7)

  return (
    <div className={`w-56 ${className}`}>
      <div className="mb-2 flex h-7 items-center justify-between">
        {onPrev ? (
          <Button variant="ghost" size="icon-sm" onClick={onPrev}>
            <ChevronLeftIcon />
            <span className="sr-only">{m.table_prev()}</span>
          </Button>
        ) : (
          <span className="size-8" />
        )}
        <span className="text-sm font-semibold">{title}</span>
        {onNext ? (
          <Button variant="ghost" size="icon-sm" onClick={onNext}>
            <ChevronRightIcon />
            <span className="sr-only">{m.table_next()}</span>
          </Button>
        ) : (
          <span className="size-8" />
        )}
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {columns.map((dow) => (
          <span key={dow} className="py-1">
            {weekday.format(new Date(2023, 0, 1 + dow))}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {blanks.map((key) => (
          <span key={key} />
        ))}
        {days.map((day) => {
          const future = day > today
          const edge = day === lo || day === hi
          const inside = lo && hi && day > lo && day < hi
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => onDay(day)}
              onMouseEnter={() => onHover?.(day)}
              className={`h-8 text-sm tabular-nums transition-colors disabled:text-muted-foreground/40 ${
                edge
                  ? 'rounded-md bg-brand font-semibold text-brand-foreground'
                  : inside
                    ? 'bg-secondary'
                    : 'rounded-md hover:bg-accent'
              } ${day === today && !edge ? 'font-semibold underline underline-offset-4' : ''}`}
            >
              {Number(day.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
