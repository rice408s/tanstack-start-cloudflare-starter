import { useInView } from '@/lib/motion'

/**
 * The frame every block sits in: one IntersectionObserver, one max width,
 * one vertical rhythm. A block never opens its own <section> — it takes
 * `inView` from here and spreads it onto its children.
 *
 * `tone` picks the ground. Most blocks are 'plain' (the page ground); a
 * block that needs to read as a band of its own takes 'sheet', which lays a
 * rounded --surface sheet under the whole section. Alternating the two is
 * what keeps a long page from reading as one column of text, and it costs
 * no assets.
 */
export function Section({
  tone = 'plain',
  threshold = 0.15,
  children,
}: {
  tone?: 'plain' | 'sheet'
  threshold?: number
  children: (inView: boolean) => React.ReactNode
}) {
  const { ref, inView } = useInView<HTMLElement>(threshold)
  if (tone === 'sheet') {
    return (
      <section ref={ref} className="w-full px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-7xl rounded-3xl bg-surface px-6 py-14 sm:px-12 sm:py-20">
          {children(inView)}
        </div>
      </section>
    )
  }
  return (
    <section
      ref={ref}
      className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28"
    >
      {children(inView)}
    </section>
  )
}

/**
 * Kicker, title and lead in a 3-beat stagger. Every block that has a heading
 * uses this one, so the page has a single heading rhythm no matter how many
 * block shapes are in play. Movement and opacity only, never colour.
 */
export function SectionHead({
  kicker,
  title,
  lead,
  inView,
  align = 'start',
}: {
  kicker: string
  title: string
  lead?: string
  inView: boolean
  align?: 'start' | 'center'
}) {
  const on = inView ? 'in' : ''
  const centered = align === 'center'
  return (
    <div
      className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : ''}`}
    >
      <p className={`appear ${on} kicker`}>{kicker}</p>
      {/* The mask clips to its box, and a 48px heading at leading 1.0 puts its
          descenders below the line box — so the wrapper bleeds 8px and pulls
          it back with a negative margin. 4px was not enough: `g` and `y` on
          the last line came back shaved. */}
      <div
        className={`appear-mask ${on} -my-2 py-2`}
        style={{ '--appear-delay': '80ms' } as React.CSSProperties}
      >
        {/* The display face carries every section heading, not just the
            hero — a page that establishes a voice on screen one and drops it
            on screen two has no voice. Weight and tracking come from
            `.display-sans`; don't add `font-medium`/`tracking-*` on top. */}
        <h2 className="display-sans max-w-2xl text-5xl leading-[0.95] sm:text-6xl">
          {title}
        </h2>
      </div>
      {lead ? (
        <p
          className={`appear ${on} max-w-xl text-lg leading-relaxed text-muted-foreground`}
          style={{ '--appear-delay': '160ms' } as React.CSSProperties}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}
