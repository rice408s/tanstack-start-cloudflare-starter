import { StackMark } from '@/components/marketing/stack-mark'
import { Section, SectionHead } from './section'
import type { Of } from './shared'

/** Grouped name chips beside the heading. */
export function ChipsBlock({ block }: { block: Of<'chips'> }) {
  // How many chips precede each group, so a chip's stagger is a pure function
  // of where it sits. A running `chip++` counter would be wrong here: the
  // observer lives in Section, so this render prop is called again when
  // `inView` flips WITHOUT ChipsBlock re-rendering — a counter declared in the
  // component body would keep climbing and the delays would differ between
  // the server render and the first client render (a hydration mismatch).
  const before = block.groups.map((_, r) =>
    block.groups.slice(0, r).reduce((n, g) => n + g.names.length, 0),
  )
  return (
    <Section tone={block.tone} threshold={0.25}>
      {(inView) => (
        <div className="grid grid-cols-12 gap-x-3 gap-y-10">
          <div className="col-span-12 lg:col-span-5">
            <SectionHead
              kicker={block.kicker()}
              title={block.title()}
              lead={block.lead?.()}
              inView={inView}
            />
          </div>
          <dl className="col-span-12 flex flex-col gap-8 lg:col-span-6 lg:col-start-7 lg:pt-10">
            {block.groups.map((row, r) => (
              <div key={row.group()} className="flex flex-col gap-3">
                <dt
                  className={`appear ${inView ? 'in' : ''} kicker`}
                  style={
                    {
                      '--appear-delay': `${200 + r * 140}ms`,
                    } as React.CSSProperties
                  }
                >
                  {row.group()}
                </dt>
                <dd className="m-0 flex flex-wrap gap-2">
                  {row.names.map((item, n) => (
                    <span
                      key={item.name}
                      className={`appear ${inView ? 'in' : ''} flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-medium`}
                      style={
                        {
                          '--appear-delay': `${260 + r * 140 + (before[r] + n) * 70}ms`,
                        } as React.CSSProperties
                      }
                    >
                      {item.icon ? <StackMark slug={item.icon} /> : null}
                      {item.name}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Section>
  )
}
