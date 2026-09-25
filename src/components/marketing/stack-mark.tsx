import { STACK_ICONS, type StackIconSlug } from './stack-icons'

/**
 * A brand mark in its own colour — the one exception to the "text is never
 * coloured" rule (src/CLAUDE.md rule 0). Each mark carries one colour per
 * ground (see stack-icons.ts): the two differ only where the brand's own
 * colour would be invisible on that ground. The pair is handed to CSS as
 * custom properties so the theme switch needs no JavaScript and no second
 * copy of the path.
 */
export function StackMark({
  slug,
  className = 'size-4',
}: {
  slug: StackIconSlug
  className?: string
}) {
  const icon = STACK_ICONS[slug]
  return (
    <svg
      viewBox={icon.viewBox}
      className={`${className} shrink-0 fill-[var(--mark)] dark:fill-[var(--mark-dark)]`}
      style={
        {
          '--mark': icon.light,
          '--mark-dark': icon.dark,
        } as React.CSSProperties
      }
      role="img"
      aria-label={icon.title}
    >
      <path d={icon.path} fillRule={icon.evenodd ? 'evenodd' : undefined} />
    </svg>
  )
}
