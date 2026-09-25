import type { ReactNode } from 'react'

// Title block for in-app pages: optional kicker, h1, one-line description,
// and actions on the right. Console scale, not marketing scale, but the
// title is the one thing on a working screen that should be found without
// looking: text-2xl bold, so weight — not size — separates it from the
// semibold section headings and regular body below. Every page below it is full-width and
// left-aligned — no `mx-auto max-w-*` wrappers. A centred column next to
// full-width tables, or a capped column hugging the left edge, both read
// as a different app; a form keeps its label-left/control-right rows and
// a grid of objects (plans, packs) sizes its cells, not the page.
export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-1.5">{kicker}</p>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

// Content block used across the app pages: a heading row with an
// optional aside, a hairline, then the body.
//
// Plain by default. A page gets at most ONE layer of tinted surface, and a
// tinted block is for a thing that must read as an object (a plan you can
// buy, a key you were just shown) — never for grouping, which spacing and
// the heading do on their own. Stacking tinted blocks is what turned every
// screen into a wall of grey cards; `tone="tinted"` is the opt-in for the
// few places that earn it.
export function Panel({
  title,
  aside,
  tone = 'plain',
  className = '',
  children,
}: {
  title?: ReactNode
  aside?: ReactNode
  tone?: 'plain' | 'tinted'
  className?: string
  children: ReactNode
}) {
  const tinted = tone === 'tinted'
  return (
    <section
      className={`${tinted ? 'rounded-lg bg-secondary p-5' : ''} ${className}`}
    >
      {(title || aside) && (
        <div
          className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${
            tinted ? 'mb-4' : 'mb-3 border-b pb-2'
          }`}
        >
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {aside && (
            <div className="text-sm text-muted-foreground">{aside}</div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

// A row of figures: label above value, side by side, divided by hairlines.
// Replaces one-number-per-card grids — a KPI is a glance, not a poster.
export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-y-4 divide-x divide-border rounded-lg border">
      {children}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  className = '',
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex min-w-36 flex-1 flex-col px-5 py-4 ${className}`}>
      <p className="kicker">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint !== undefined && (
        <div className="mt-0.5 min-h-4 text-xs text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  )
}
