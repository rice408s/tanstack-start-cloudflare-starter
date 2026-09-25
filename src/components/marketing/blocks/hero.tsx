import { Link } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'
import { ctaLabel, ctaTo, type Of } from './shared'

// ---------------------------------------------------------------------------
// Hero + logos — the first screen, rendered together above the fold.
// ---------------------------------------------------------------------------

/**
 * A single centred column: the claim, one line of what it is, and the two
 * things a reader can do next. Nothing else — no typed command, no
 * auto-advancing showcase. The command with its real output is one screen
 * down; anything that moves while a reader evaluates a tool costs more than
 * it earns.
 */
export function HeroBlock({ block }: { block: Of<'hero'> }) {
  return (
    <section className="appear-now mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 text-center sm:px-6">
      <h1 className="display-sans appear text-5xl leading-[0.95] sm:text-7xl">
        {block.title()}
      </h1>
      <p
        className="appear max-w-2xl text-lg leading-relaxed text-muted-foreground"
        style={{ '--appear-delay': '80ms' } as React.CSSProperties}
      >
        {block.subtitle()}
      </p>
      <div
        className="appear flex flex-wrap items-center justify-center gap-3"
        style={{ '--appear-delay': '160ms' } as React.CSSProperties}
      >
        <Link
          to={ctaTo}
          className="rounded-[var(--radius-btn)] bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
        >
          {ctaLabel()}
        </Link>
        <Link
          to="/docs"
          className="rounded-[var(--radius-btn)] bg-secondary px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-surface"
        >
          {m.marketing_cta_band_docs()}
        </Link>
      </div>
    </section>
  )
}
