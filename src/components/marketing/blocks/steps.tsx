import { StackMark } from '@/components/marketing/stack-mark'
import { m } from '@/paraglide/messages'
import { Section, SectionHead } from './section'
import type { Of } from './shared'
import { Terminal } from './terminal'

/**
 * Three steps in a row, not a zigzag down the page: a short title over a
 * shell block, and the transcript does the explaining. Under the heading, an
 * optional row of marks names who runs them. The blocks share a height so
 * the row reads as one strip rather than three boxes of different lengths.
 */
export function StepsBlock({ block }: { block: Of<'steps'> }) {
  return (
    <Section tone={block.tone} threshold={0.15}>
      {(inView) => {
        const on = inView ? 'in' : ''
        return (
          <>
            <SectionHead
              kicker={block.kicker()}
              title={block.title()}
              lead={block.lead?.()}
              inView={inView}
            />
            {block.marks ? (
              <ul className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                {block.marks.map((mark, i) => (
                  <li
                    key={mark.name}
                    className={`appear ${on} flex items-center gap-2 text-sm font-medium whitespace-nowrap text-muted-foreground`}
                    style={
                      {
                        '--appear-delay': `${160 + i * 40}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {mark.icon ? (
                      <StackMark slug={mark.icon} className="size-4" />
                    ) : null}
                    {mark.name}
                  </li>
                ))}
              </ul>
            ) : null}
            <ol className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-3">
              {block.steps.map((step, i) => (
                <li
                  key={step.title()}
                  className={`appear ${on} flex min-w-0 flex-col gap-4`}
                  style={
                    {
                      '--appear-delay': `${280 + i * 90}ms`,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="kicker">
                      {m.marketing_step_n({ n: String(i + 1) })}
                    </p>
                    <p className="text-lg font-medium tracking-tight">
                      {step.title()}
                    </p>
                    {step.body ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.body()}
                      </p>
                    ) : null}
                  </div>
                  <Terminal lines={step.lines} className="flex-1" />
                </li>
              ))}
            </ol>
          </>
        )
      }}
    </Section>
  )
}
