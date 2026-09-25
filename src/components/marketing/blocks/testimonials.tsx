import { Section, SectionHead } from './section'
import type { Of } from './shared'

type Quote = Of<'testimonials'>['items'][number]

function QuoteCard({ item }: { item: Quote }) {
  return (
    <figure className="flex h-full w-[20rem] flex-col justify-between gap-8 rounded-3xl bg-surface p-6 sm:w-[24rem]">
      <blockquote className="text-[15px] leading-relaxed">
        {item.quote()}
      </blockquote>
      <figcaption className="flex items-center gap-3">
        {item.avatar ? (
          // White in both themes: the drawings are black line art, and a
          // sticker reads better on the dark ground than inverted lines.
          <img
            src={item.avatar}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="size-10 shrink-0 rounded-full bg-white"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
            {item.initials}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{item.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {item.email ?? item.role?.()}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * A wall of voices that moves by itself. Two rows drift in opposite
 * directions (one row when there are too few quotes to fill two), each
 * pausing under the pointer so a reader can finish the card they started.
 * Nothing needs clicking, and no quote is hidden behind another: every one
 * passes by.
 *
 * Each track holds its list twice and the animation moves it one list-width
 * (`.marquee` in styles.css), so the loop has no seam. Spacing is padding on
 * the item rather than `gap`, which would make the halves unequal. Under
 * reduced motion the tracks stop and scroll by hand instead.
 */
export function TestimonialsBlock({ block }: { block: Of<'testimonials'> }) {
  if (block.items.length === 0) return null
  const rows =
    block.items.length >= 4
      ? [
          block.items.filter((_, i) => i % 2 === 0),
          block.items.filter((_, i) => i % 2 === 1),
        ]
      : [block.items]
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
            className={`appear ${inView ? 'in' : ''} mt-12 flex flex-col gap-3 sm:mt-16`}
            style={{ '--appear-delay': '200ms' } as React.CSSProperties}
          >
            {rows.map((row, r) => (
              <div
                key={row[0].name}
                // The edges fade rather than cut: a card sliced by the
                // column edge reads as a layout bug. A mask, not a colour —
                // it works on either ground and paints nothing of its own.
                className="marquee [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
                style={
                  {
                    '--marquee-duration': `${row.length * 14 + r * 8}s`,
                  } as React.CSSProperties
                }
              >
                <ul
                  className={`marquee-track ${r % 2 === 1 ? 'marquee-reverse' : ''}`}
                >
                  {[0, 1].map((copy) =>
                    row.map((item) => (
                      <li
                        key={`${copy}-${item.name}`}
                        aria-hidden={copy === 1}
                        className="pr-3"
                      >
                        <QuoteCard item={item} />
                      </li>
                    )),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  )
}
