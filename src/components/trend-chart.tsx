import { useId, useState } from 'react'
import { getLocale } from '@/paraglide/runtime'

// Dependency-free SVG bar chart for daily series: y gridlines with labels,
// x date ticks, and a hover readout (day + value). Colors come from the
// --chart-* tokens so it follows the palette and dark mode. Swap for a
// charting lib only if you need zoom/multi-series.

export type TrendPoint = { day: string; value: number }

const W = 640
const PAD = { top: 8, right: 8, bottom: 22, left: 44 }

function niceMax(max: number) {
  const exp = 10 ** Math.floor(Math.log10(max))
  const unit = max / exp
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10
  return nice * exp
}

export function TrendChart({
  points,
  format = (v) => String(v),
  color = 'var(--chart-1)',
  height = 160,
  // Floor for the y axis so tiny/empty series still get integer ticks
  // (2 for counts; pass 200 for cents so ticks are whole currency units).
  minMax = 2,
  className,
}: {
  points: TrendPoint[]
  format?: (value: number) => string
  color?: string
  height?: number
  minMax?: number
  className?: string
}) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)

  const plotW = W - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const yMax = niceMax(Math.max(...points.map((p) => p.value), minMax))
  const n = Math.max(1, points.length)
  const slot = plotW / n
  const gap = n > 60 ? 0.5 : n > 30 ? 1.5 : 3
  const barW = Math.max(1, slot - gap)
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH

  const dateFmt = new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // days are UTC buckets
  })
  const label = (day: string) => dateFmt.format(new Date(`${day}T00:00:00Z`))

  const yTicks = [0, 0.5, 1].map((f) => f * yMax)
  // ~6 x ticks, always including first and last day.
  const step = Math.max(1, Math.ceil(n / 6))
  const xTicks = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % step === 0 || i === n - 1)

  const active = hover === null ? null : points[hover]

  return (
    <div className={className}>
      <div className="relative">
        <svg
          role="img"
          aria-labelledby={id}
          viewBox={`0 0 ${W} ${height}`}
          className="block w-full"
          style={{ height: 'auto', aspectRatio: `${W} / ${height}` }}
          onMouseLeave={() => setHover(null)}
        >
          <title id={id}>
            {points.length
              ? `${label(points[0].day)} – ${label(points[n - 1].day)}`
              : ''}
          </title>
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border)"
                strokeDasharray={v === 0 ? undefined : '2 4'}
              />
              <text
                x={PAD.left - 8}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--muted-foreground)"
              >
                {format(v)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = PAD.left + i * slot
            const h = (p.value / yMax) * plotH
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: hover readout only; values are also in the <title> and the summary
              <g key={p.day} onMouseEnter={() => setHover(i)}>
                {/* full-height hit area so thin bars are easy to hover */}
                <rect
                  x={x}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill={hover === i ? 'var(--accent)' : 'transparent'}
                />
                <rect
                  x={x + gap / 2}
                  y={PAD.top + plotH - h}
                  width={barW}
                  height={Math.max(h, p.value > 0 ? 2 : 0)}
                  rx={Math.min(3, barW / 2)}
                  fill={color}
                  opacity={hover === null || hover === i ? 0.9 : 0.55}
                />
              </g>
            )
          })}
          {xTicks.map(({ p, i }) => (
            <text
              key={p.day}
              x={PAD.left + i * slot + slot / 2}
              y={height - 6}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {label(p.day)}
            </text>
          ))}
        </svg>
        {active && (
          <div className="pointer-events-none absolute top-0 right-0 rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background">
            <span className="opacity-70">{label(active.day)}</span>{' '}
            <span className="font-semibold">{format(active.value)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
