import { Section, SectionHead } from './section'
import type { Of } from './shared'

/**
 * Proof by output — the products people built with it. It beats a feature
 * list because a reader can check it, which is also why an empty `items`
 * renders nothing at all rather than a row of invented launches.
 */
export function GalleryBlock({ block }: { block: Of<'gallery'> }) {
  if (block.items.length === 0) return null
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
          <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, i) => (
              <li
                key={item.title()}
                className={`appear ${inView ? 'in' : ''} flex flex-col gap-3 rounded-3xl bg-surface p-6`}
                style={
                  {
                    '--appear-delay': `${200 + i * 70}ms`,
                  } as React.CSSProperties
                }
              >
                <p className="text-lg font-medium">{item.title()}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.body()}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    rel="noreferrer"
                    target="_blank"
                    className="mt-auto pt-3 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {new URL(item.href).hostname}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}
