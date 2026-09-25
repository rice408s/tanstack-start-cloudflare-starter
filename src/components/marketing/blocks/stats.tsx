import { CountUp } from '@/lib/motion'
import { Section } from './section'
import type { Of } from './shared'

// ---------------------------------------------------------------------------
// Blocks below the fold. Each takes its observer from Section.
// ---------------------------------------------------------------------------

/**
 * A band of figures, no heading. It is the cheapest way to break a column of
 * prose — four numbers read in about a second and carry more than the
 * paragraph they replace. Keep every figure checkable against the repo:
 * a number nobody measured ages badly and cannot be defended.
 */
export function StatsBlock({ block }: { block: Of<'stats'> }) {
  return (
    <Section tone={block.tone ?? 'sheet'} threshold={0.3}>
      {(inView) => (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {block.items.map((item, i) => (
            <div
              key={item.label()}
              className={`appear ${inView ? 'in' : ''} flex flex-col gap-3`}
              style={{ '--appear-delay': `${i * 90}ms` } as React.CSSProperties}
            >
              <dd className="text-6xl leading-none font-medium tracking-[-0.04em] tabular-nums sm:text-7xl">
                <CountUp
                  value={item.value}
                  active={inView}
                  format={(n) => `${n}${item.suffix ?? ''}`}
                />
              </dd>
              <dt className="max-w-56 text-sm leading-relaxed text-muted-foreground">
                {item.label()}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </Section>
  )
}
