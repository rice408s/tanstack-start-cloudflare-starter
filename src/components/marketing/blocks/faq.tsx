import { Section, SectionHead } from './section'
import type { Of } from './shared'

export function FaqBlock({ block }: { block: Of<'faq'> }) {
  return (
    <Section tone={block.tone} threshold={0.15}>
      {(inView) => (
        <div className="grid grid-cols-12 gap-x-3 gap-y-10">
          <div className="col-span-12 lg:col-span-4">
            <SectionHead
              kicker={block.kicker()}
              title={block.title()}
              lead={block.lead?.()}
              inView={inView}
            />
          </div>
          <div className="col-span-12 flex flex-col gap-3 lg:col-span-7 lg:col-start-6">
            {block.items.map((item, i) => (
              <details
                key={item.q()}
                className={`appear ${inView ? 'in' : ''} fold faq group rounded-2xl bg-surface px-5 py-4`}
                style={
                  {
                    '--appear-delay': `${160 + i * 60}ms`,
                  } as React.CSSProperties
                }
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
                  {item.q()}
                  <span
                    aria-hidden
                    className="shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="faq-answer mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {item.a()}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
