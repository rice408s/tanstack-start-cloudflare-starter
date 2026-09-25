import { StackMark } from '@/components/marketing/stack-mark'
import { Section, SectionHead } from './section'
import type { Of } from './shared'

/**
 * The stack, grouped, carried by marks. Same information the `chips` block
 * holds and none of the sentences: a mark says "Stripe" faster than the word
 * does, and a grid of them says "this is wired to real things" with no copy
 * at all.
 */
export function LogosGroupedBlock({ block }: { block: Of<'logos-grouped'> }) {
  let cell = 0
  return (
    <Section tone={block.tone} threshold={0.2}>
      {(inView) => (
        <>
          <SectionHead
            kicker={block.kicker()}
            title={block.title()}
            lead={block.lead?.()}
            inView={inView}
          />
          <dl className="mt-12 grid grid-cols-1 gap-x-3 gap-y-10 lg:grid-cols-3">
            {block.groups.map((group, g) => (
              <div key={group.group()} className="flex flex-col gap-5">
                <dt
                  className={`appear ${inView ? 'in' : ''} kicker`}
                  style={
                    {
                      '--appear-delay': `${160 + g * 120}ms`,
                    } as React.CSSProperties
                  }
                >
                  {group.group()}
                </dt>
                <dd className="m-0 flex flex-wrap items-center gap-x-6 gap-y-5">
                  {group.names.map((item) => (
                    <span
                      key={item.name}
                      title={item.name}
                      className={`appear ${inView ? 'in' : ''} flex items-center gap-2 text-sm font-medium text-muted-foreground`}
                      style={
                        {
                          '--appear-delay': `${220 + cell++ * 60}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <StackMark slug={item.icon} className="size-5" />
                      {item.name}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Section>
  )
}
