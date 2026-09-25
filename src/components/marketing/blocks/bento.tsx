import { Section, SectionHead } from './section'
import type { Of } from './shared'

// Tailwind needs the whole class name in the source, so spans are a lookup
// rather than a template string.
const SPAN: Record<
  NonNullable<Of<'bento'>['items'][number]['span']>,
  string
> = {
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
}

/**
 * An uneven grid over six columns. The unevenness is the point: a 3x2 grid of
 * identical cards reads as a list, and a reader skims a list. Give the one or
 * two items that carry the argument a wider span and the eye lands there
 * first.
 */
export function BentoBlock({ block }: { block: Of<'bento'> }) {
  return (
    <Section tone={block.tone} threshold={0.15}>
      {(inView) => (
        <>
          <SectionHead
            kicker={block.kicker()}
            title={block.title()}
            lead={block.lead?.()}
            inView={inView}
          />
          <ul className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-6">
            {block.items.map((item, i) => (
              <li
                key={item.title()}
                className={`appear ${inView ? 'in' : ''} ${SPAN[item.span ?? 2]} flex flex-col gap-3 rounded-3xl bg-surface p-6 transition-colors duration-200 hover:bg-secondary`}
                style={
                  {
                    '--appear-delay': `${240 + i * 90}ms`,
                  } as React.CSSProperties
                }
              >
                <p className="text-lg font-medium">{item.title()}</p>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {item.body()}
                </p>
                {item.path ? (
                  <code className="mt-auto pt-3 font-mono text-xs text-muted-foreground">
                    {item.path}
                  </code>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}
