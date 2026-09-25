import { StackMark } from '@/components/marketing/stack-mark'
import { Section, SectionHead } from './section'
import type { Of } from './shared'

/**
 * The contents, as a ledger. Every row has the same anatomy — number, name,
 * chips, path — and differs only in what its chips say and how many there
 * are, which is the differentiation that matters: a reader compares rows
 * rather than reading cards. The number and the display-sized name carry
 * the row; the chips are `bg-surface` (rule 10's chip kicker), so this block
 * stays on the plain ground. No tints or rules between rows — the left
 * column's size is the separator.
 */
export function ModulesBlock({ block }: { block: Of<'modules'> }) {
  return (
    <Section tone={block.tone} threshold={0.1}>
      {(inView) => (
        <>
          <SectionHead
            kicker={block.kicker()}
            title={block.title()}
            lead={block.lead?.()}
            inView={inView}
          />
          <ol className="mt-12 flex flex-col gap-y-10 sm:mt-16 sm:gap-y-12">
            {block.items.map((item, i) => (
              <li
                key={item.title()}
                className={`appear ${inView ? 'in' : ''} grid grid-cols-12 gap-x-3 gap-y-4`}
                style={
                  {
                    '--appear-delay': `${200 + i * 80}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="col-span-12 flex items-baseline gap-4 lg:col-span-4">
                  <span className="kicker w-6 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="text-2xl font-medium tracking-tight">
                      {item.title()}
                    </p>
                    {item.path ? (
                      <code className="font-mono text-xs text-muted-foreground">
                        {item.path}
                      </code>
                    ) : null}
                  </div>
                </div>
                <ul className="col-span-12 flex flex-wrap content-start gap-2 lg:col-span-8 lg:pl-10">
                  {item.facts.map((fact) => (
                    <li
                      key={fact.label()}
                      className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-medium"
                    >
                      {fact.icon ? (
                        <StackMark slug={fact.icon} className="size-4" />
                      ) : null}
                      {fact.label()}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </Section>
  )
}
