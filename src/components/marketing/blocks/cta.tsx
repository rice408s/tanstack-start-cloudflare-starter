import { Link } from '@tanstack/react-router'
import { Section } from './section'
import { ctaLabel, ctaTo, type Of } from './shared'

/**
 * The last thing the page says, and the action that follows it. The line used
 * to light up word by word on scroll; it now arrives with the rest of the
 * section, so the closing beat is read rather than watched.
 */
export function CtaBlock({ block }: { block: Of<'cta'> }) {
  return (
    <Section threshold={0.4}>
      {(inView) => {
        const on = inView ? 'in' : ''
        return (
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <h2
              className={`appear ${on} max-w-2xl text-4xl leading-[1.05] font-medium tracking-[-0.02em] sm:text-6xl`}
            >
              {block.title()}
            </h2>
            <div
              className={`appear ${on} flex shrink-0 items-center gap-6`}
              style={{ '--appear-delay': '120ms' } as React.CSSProperties}
            >
              <Link
                to={ctaTo}
                className="rounded-[var(--radius-btn)] bg-brand px-7 py-3.5 text-sm font-semibold whitespace-nowrap text-brand-foreground transition-opacity hover:opacity-90"
              >
                {ctaLabel()}
              </Link>
              <Link
                to="/docs"
                className="text-sm font-medium whitespace-nowrap text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {block.docs()}
              </Link>
            </div>
          </div>
        )
      }}
    </Section>
  )
}
