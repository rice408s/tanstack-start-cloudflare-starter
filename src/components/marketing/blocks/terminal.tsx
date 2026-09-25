/**
 * A shell block — the page's strongest visual without a single byte of
 * asset. Its ground and both text tones come from --terminal* in styles.css,
 * sized so the block reads as a raised surface rather than a hole punched in
 * the page.
 *
 * Four kinds of line, so one block can be a shell recording or a session
 * with a coding agent:
 *
 *   'bun run dev'        a command — `$` gutter
 *   { out: '…' }         what came back — gray, gutter empty
 *   { ask: () => '…' }   what you said to the agent — drawn as the input box
 *                        it was typed into, in the page's sans face, so the
 *                        reader's part and the agent's part never blur. The
 *                        one line that is localized: it is the reader's own
 *                        words
 *   { did: '…' }         a thing the agent did — `●` gutter
 *
 * Output is what makes a block read as a recording rather than a list of
 * things to type — prefer at least one `out` line per block.
 */
export type TermLine =
  | string
  | { out: string }
  | { ask: () => string }
  | { did: string }

function Gutter({ mark }: { mark: string }) {
  return (
    <span aria-hidden className="text-terminal-muted select-none">
      {mark}
    </span>
  )
}

function Line({ line }: { line: TermLine }) {
  if (typeof line === 'string') {
    return (
      <div>
        <Gutter mark="$ " />
        {line}
      </div>
    )
  }
  if ('ask' in line) {
    return (
      <div className="mb-3 rounded-xl border border-terminal-line px-3 py-2 font-sans text-sm font-medium whitespace-normal">
        {line.ask()}
      </div>
    )
  }
  if ('did' in line) {
    return (
      <div>
        <Gutter mark="● " />
        {line.did}
      </div>
    )
  }
  return (
    <div className="text-terminal-muted">
      <Gutter mark="  " />
      {line.out}
    </div>
  )
}

export function Terminal({
  lines,
  label,
  className = '',
  style,
}: {
  lines: TermLine[]
  label?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-terminal text-terminal-foreground ${className}`}
      style={style}
    >
      {/* A title row, not window chrome: no dots, no bar, just the working
          directory in the same gray the output uses. */}
      {label ? (
        <p className="px-5 pt-4 font-mono text-xs text-terminal-muted">
          {label}
        </p>
      ) : null}
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6">
        {lines.map((line, i) => (
          // Lines repeat (two `bun run test`s), and the list never reorders.
          // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
          <Line key={i} line={line} />
        ))}
      </pre>
    </div>
  )
}
