import { Section, SectionHead } from './section'
import type { Of } from './shared'
import { Terminal } from './terminal'

/** A heading over one shell block. */
export function TerminalBlock({ block }: { block: Of<'terminal'> }) {
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
          <Terminal
            label={block.label?.()}
            lines={block.lines}
            className={`appear ${inView ? 'in' : ''} mt-12`}
            style={{ '--appear-delay': '240ms' } as React.CSSProperties}
          />
        </>
      )}
    </Section>
  )
}
