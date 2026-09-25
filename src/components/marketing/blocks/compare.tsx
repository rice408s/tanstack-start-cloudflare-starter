import { Section, SectionHead } from './section'
import type { Of } from './shared'

/**
 * A comparison table — the one shape on the page that answers a question
 * ("which of these two do I pick?") instead of making a claim. Rows are
 * separated by an alternating tint rather than rules: fills group content,
 * lines are rare (src/CLAUDE.md rule 8). The table scrolls sideways inside
 * its own container so the page body never does.
 */
export function CompareBlock({ block }: { block: Of<'compare'> }) {
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
          <div
            className={`appear ${inView ? 'in' : ''} mt-12 overflow-x-auto rounded-3xl bg-surface p-2 sm:p-3`}
            style={{ '--appear-delay': '240ms' } as React.CSSProperties}
          >
            <table className="w-full min-w-xl border-collapse text-left">
              <thead>
                <tr>
                  <th className="kicker px-4 py-3 font-semibold" />
                  {block.columns.map((column) => (
                    <th
                      key={column()}
                      className="kicker px-4 py-3 font-semibold"
                    >
                      {column()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  // `odd:` has to sit on the ROW and reach down to its cells.
                  // Written the other way round (`[&>td]:odd:`) it asks each
                  // cell whether IT is odd, which stripes the columns.
                  <tr
                    key={row.label()}
                    className="odd:[&>td]:bg-background [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl"
                  >
                    <td className="px-4 py-3.5 align-top text-sm font-medium">
                      {row.label()}
                    </td>
                    {row.cells.map((cell, c) => (
                      <td
                        // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional — they index the columns above
                        key={c}
                        className="px-4 py-3.5 align-top text-sm leading-relaxed text-muted-foreground"
                      >
                        {cell()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  )
}
