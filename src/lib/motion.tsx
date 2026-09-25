import { useEffect, useRef, useState } from 'react'

/*
 * Marketing motion helpers (jitter.video-inspired). Movement/opacity only —
 * pairs with the .appear/.appear-pop/.marquee utilities in styles.css.
 */

/**
 * True once the element has scrolled into view, and it stays true as the
 * reader keeps scrolling down past it. Scrolling back up rewinds it: the
 * moment the element's top drops below EXIT_LINE of the viewport — while
 * most of it is still on screen, so the exit is seen — `in` is dropped, and
 * scrolling down again replays the entrance. Spread the class onto
 * children: `appear ${inView ? 'in' : ''}` with per-child `--appear-delay`
 * for stagger. For above-the-fold content skip the hook and wrap in
 * `.appear-now` instead.
 */
const EXIT_LINE = 0.5
// Fine-grained thresholds so the callback also fires as the element slides
// down the viewport, not only at the entrance threshold.
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)

export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }
    let lastY = window.scrollY
    let seen = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const y = window.scrollY
        const down = y >= lastY
        lastY = y
        if (entry.intersectionRatio >= threshold && (down || !seen)) {
          seen = true
          setInView(true)
        } else if (
          !down &&
          entry.boundingClientRect.top > window.innerHeight * EXIT_LINE
        ) {
          setInView(false)
        }
      },
      { threshold: [...STEPS, threshold] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

/**
 * Scroll-linked word reveal: words start as a light neutral and turn
 * foreground one by one as the paragraph crosses the viewport. The unlit
 * state is transitional (decorative), so it may sit below AA — the resting
 * state is full foreground.
 */
export function ScrollRevealText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [lit, setLit] = useState(0)
  // Chinese has no spaces; fall back to per-character reveal.
  const words = text.includes(' ') ? text.split(' ') : Array.from(text)
  const joiner = text.includes(' ') ? ' ' : ''

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLit(words.length)
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewport = window.innerHeight
      // 0 when the block's top reaches 85% viewport, 1 when its bottom
      // passes 35% — the reveal finishes while the text is still on screen.
      const start = viewport * 0.85
      const end = viewport * 0.35
      const progress = (start - rect.top) / (start - end + rect.height)
      setLit(Math.round(Math.min(1, Math.max(0, progress)) * words.length))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [words.length])

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${
            // biome-ignore lint/suspicious/noArrayIndexKey: static text, order never changes
            i
          }`}
          className={`transition-colors duration-300 ${
            i < lit ? 'text-foreground' : 'text-border'
          }`}
        >
          {word}
          {i < words.length - 1 ? joiner : ''}
        </span>
      ))}
    </p>
  )
}

/**
 * Rolls a number from 0 to `value` once `active` flips true (~0.9s, eased).
 * `format` turns the in-flight integer into display text — pass the same
 * formatter the resting value uses so the last frame is pixel-identical.
 * Reduced-motion users get the final value immediately.
 */
export function CountUp({
  value,
  active,
  format,
  className,
}: {
  value: number
  active: boolean
  format: (n: number) => string
  className?: string
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!active) return
    if (
      value === 0 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(value)
      return
    }
    const duration = 900
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, value])

  return <span className={className}>{format(shown)}</span>
}

/**
 * Turns a tall element's scroll progress into a stage index, 0…count-1.
 *
 * Pair it with a `sticky` child: the outer element is `count` screens tall,
 * the sticky child holds one screen, and the reader advances the stages by
 * scrolling past. `offset` is how far from the top of the viewport that child
 * hangs — pass the same number it uses for `top-*` (a fixed header's height,
 * usually), or the stages change one header early. `stage` divides the travel into equal shares — the last
 * one keeps the screen until the section leaves, so the final stage is never
 * a flash on the way out.
 *
 * `reduced` reports the reader's reduced-motion preference so the caller can
 * render a plain stack instead: a scroll-driven swap is motion the reader did
 * not ask for, and unlike an entrance it cannot simply be skipped. It starts
 * false and is only ever set after mount, which is what keeps the server
 * render and the first client render identical.
 */
export function useScrollStages<T extends HTMLElement>(
  count: number,
  offset = 0,
) {
  const ref = useRef<T>(null)
  const [stage, setStage] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // How far the sticky child can travel before the section ends. The
      // child hangs at `offset` from the top and is that much shorter than
      // the viewport, so both ends of the run shift by the same amount —
      // pass the same offset here that the child uses for `top-*`, or the
      // stages drift out of step with what is on screen.
      const travel = rect.height - (window.innerHeight - offset)
      if (travel <= 0) return
      const progress = Math.min(1, Math.max(0, (offset - rect.top) / travel))
      setStage(Math.min(count - 1, Math.floor(progress * count)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [count, offset])

  return { ref, stage, reduced }
}

/**
 * True once the page has scrolled past `after` pixels.
 *
 * For the sticky header's hairline: at the very top the bar sits on the same
 * ground as the content under it and a rule there is drawing a line through
 * nothing. The moment content starts sliding beneath it, the line is doing
 * real work — separating two things that overlap.
 *
 * Starts false, and only ever becomes true after mount, so the server render
 * and the first client render agree (the page always loads at the top).
 */
export function useScrolled(after = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      setScrolled(window.scrollY > after)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [after])
  return scrolled
}
