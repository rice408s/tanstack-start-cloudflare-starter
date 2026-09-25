import { StackMark } from '@/components/marketing/stack-mark'
import { useInView } from '@/lib/motion'
import type { Of } from './shared'

/**
 * Marks, static, in centred rows — the page uses it twice, for the agents
 * the repo is written for and for the stack it runs on. It used to scroll, and scrolling made
 * a fixed list of fourteen names look like an endless one. Nothing here runs
 * off the edge of the screen, so nothing is hidden from a reader who does
 * not wait.
 */
export function LogosBlock({ block }: { block: Of<'logos'> }) {
  const { ref, inView } = useInView<HTMLElement>(0.2)
  let cell = 0
  return (
    <section
      ref={ref}
      className="mx-auto mt-16 flex w-full max-w-5xl flex-col items-center gap-y-6 px-4 sm:mt-20 sm:px-6"
    >
      {block.label ? (
        <p className={`appear ${inView ? 'in' : ''} kicker text-center`}>
          {block.label()}
        </p>
      ) : null}
      {block.rows.map((row) => (
        <ul
          key={row[0].name}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
        >
          {row.map((item) => (
            <li
              key={item.name}
              className={`appear ${inView ? 'in' : ''} flex items-center gap-2.5 text-base font-medium whitespace-nowrap text-muted-foreground`}
              style={
                { '--appear-delay': `${cell++ * 50}ms` } as React.CSSProperties
              }
            >
              {item.icon ? (
                <StackMark slug={item.icon} className="size-5" />
              ) : null}
              {item.name}
            </li>
          ))}
        </ul>
      ))}
    </section>
  )
}
