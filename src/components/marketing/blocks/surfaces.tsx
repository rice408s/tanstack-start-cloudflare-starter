import { Shot } from '@/components/marketing/shot'
import { useScrollStages } from '@/lib/motion'
import { HEADER_H, type Of } from './shared'

/**
 * THE CENTREPIECE.
 *
 * A full-bleed band, `items.length` screens tall, holding one screen-sized
 * shot of a real app surface that swaps as the reader scrolls. Three things
 * are deliberate:
 *
 *   - It is FULL-BLEED. Every other block on the page is a column of cards
 *     on the page ground; this one runs edge to edge on `--band` — white in
 *     the light theme, a raised plane in the dark one. The geometry is the
 *     change, and at four screens tall it is enough of one: a tint held that
 *     long stops reading as a section and starts reading as a second site.
 *     The texture on this page is the hero's dot grid, and it is only
 *     there.
 *   - It costs more than a screen. That is the point: it is the thing a
 *     reader is meant to stop at, and a landing page should have exactly one.
 *   - It shows the REAL app (shot.tsx), captured by
 *     `bun run capture:marketing` against the seeded local database.
 *
 * The sticky child is offset by the header, not by zero: the marketing
 * header is `fixed`, so a child pinned at `top-0` is pinned UNDER it and
 * loses its first 4rem. It hangs at `top-16` and gives back the same 4rem of
 * height, which also keeps `useScrollStages` honest — the stage boundaries
 * are computed from how far the sticky child can actually travel.
 *
 * Reduced-motion readers get the same shots stacked, with no sticky and
 * no swap. A scroll-driven change is motion nobody asked for; unlike an
 * entrance, it cannot be skipped by waiting.
 */
export function SurfacesBlock({ block }: { block: Of<'surfaces'> }) {
  const count = block.items.length
  const { ref, stage, reduced } = useScrollStages<HTMLDivElement>(
    count,
    HEADER_H,
  )
  const heading = (
    <div className="mx-auto flex w-full max-w-7xl shrink-0 flex-col gap-3 px-4 sm:px-6">
      {block.kicker ? (
        <p className="kicker text-band-muted">{block.kicker()}</p>
      ) : null}
      <h2 className="display-sans max-w-3xl text-4xl leading-[0.95] sm:text-5xl">
        {block.title()}
      </h2>
    </div>
  )

  if (reduced) {
    return (
      <section className="w-full bg-band py-20 text-band-foreground sm:py-28">
        {heading}
        <ul className="mx-auto mt-12 flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6">
          {block.items.map((item) => (
            <li key={item.image} className="flex flex-col gap-4">
              <Shot name={item.image} alt={item.alt()} />
              <p className="text-xl font-medium">{item.label()}</p>
              <p className="max-w-xl text-sm leading-relaxed text-band-muted">
                {item.body()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className="w-full bg-band text-band-foreground">
      <div ref={ref} style={{ height: `${count * 100}svh` }}>
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center gap-6 py-8 sm:py-10">
          {heading}
          {/* Left: where the reader is, and what they are looking at — a
              vertical list of labels, the active one carrying its caption.
              The bar under the active label is the only progress indicator —
              no dots, no counter. Right: the shot, height-bound rather than
              width-bound so it fits beside the list without cropping. */}
          <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            <ul className="order-2 flex shrink-0 flex-col gap-4 self-center lg:order-1">
              {block.items.map((item, i) => (
                <li key={item.image} className="flex flex-col gap-1.5">
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      i === stage ? 'text-band-foreground' : 'text-band-muted'
                    }`}
                  >
                    {item.label()}
                  </span>
                  <span
                    aria-hidden
                    className={`block h-px origin-left bg-band-foreground transition-transform duration-500 ${
                      i === stage ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                  <p
                    className={`grid text-sm leading-relaxed text-band-muted transition-[grid-template-rows,opacity] duration-500 ${
                      i === stage
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <span className="min-h-0 overflow-hidden">
                      {item.body()}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="order-1 flex min-h-0 items-center justify-center lg:order-2">
              <div className="relative aspect-[16/10] max-h-full w-full">
                {block.items.map((item, i) => (
                  <div
                    key={item.image}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      i === stage ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Shot
                      name={item.image}
                      alt={item.alt()}
                      className="size-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
