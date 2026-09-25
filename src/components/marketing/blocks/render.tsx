import {
  BentoBlock,
  ChipsBlock,
  CompareBlock,
  CtaBlock,
  FaqBlock,
  GalleryBlock,
  HeroBlock,
  LogosBlock,
  LogosGroupedBlock,
  ModulesBlock,
  StatsBlock,
  StepsBlock,
  SurfacesBlock,
  TerminalBlock,
  TestimonialsBlock,
} from './blocks'
import type { LandingBlock } from './types'

/**
 * The renderer. A page is an array of blocks and this turns it into markup —
 * that is the whole of the indirection. Reordering the landing page is
 * moving a line in `src/config/landing.ts`; removing a section is deleting
 * one.
 *
 * The switch is exhaustive on purpose: the `never` branch means adding a
 * member to LandingBlock without a case here fails typecheck rather than
 * rendering nothing at runtime.
 */
function renderBlock(block: LandingBlock) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} />
    case 'logos':
      return <LogosBlock block={block} />
    case 'stats':
      return <StatsBlock block={block} />
    case 'terminal':
      return <TerminalBlock block={block} />
    case 'surfaces':
      return <SurfacesBlock block={block} />
    case 'gallery':
      return <GalleryBlock block={block} />
    case 'testimonials':
      return <TestimonialsBlock block={block} />
    case 'modules':
      return <ModulesBlock block={block} />
    case 'bento':
      return <BentoBlock block={block} />
    case 'steps':
      return <StepsBlock block={block} />
    case 'compare':
      return <CompareBlock block={block} />
    case 'chips':
      return <ChipsBlock block={block} />
    case 'logos-grouped':
      return <LogosGroupedBlock block={block} />
    case 'faq':
      return <FaqBlock block={block} />
    case 'cta':
      return <CtaBlock block={block} />
    default: {
      const exhaustive: never = block
      return exhaustive
    }
  }
}

/**
 * Blocks that belong to the first screen. A leading run of these is centred
 * in the viewport under the sticky header (h-16) so whatever follows starts
 * exactly at the fold; content taller than the screen just grows past it.
 * Put anything else first and the page simply starts scrolling from the top.
 *
 * The run shares one full-bleed `.hero-dots` layer — the page's own white
 * under a drawing-paper dot grid that fades out before the edges — so the
 * first screen is marked out by texture rather than by another tint.
 */
const FOLD: ReadonlySet<LandingBlock['type']> = new Set(['hero', 'logos'])

export function LandingBlocks({ blocks }: { blocks: readonly LandingBlock[] }) {
  const firstBelow = blocks.findIndex((block) => !FOLD.has(block.type))
  const cut = firstBelow === -1 ? blocks.length : firstBelow
  const fold = blocks.slice(0, cut)
  const rest = blocks.slice(cut)
  // The array is a static module-level constant, so position is a stable
  // identity — these blocks are never reordered, inserted or filtered at
  // runtime.
  const key = (block: LandingBlock, i: number) => `${block.type}-${i}`
  return (
    <div className="w-full">
      {fold.length > 0 ? (
        <div className="hero-dots flex min-h-[calc(100svh-4rem)] w-full flex-col justify-center py-10">
          {fold.map((block, i) => (
            <div key={key(block, i)} className="contents">
              {renderBlock(block)}
            </div>
          ))}
        </div>
      ) : null}
      {rest.map((block, i) => (
        <div key={key(block, i)} className="contents">
          {renderBlock(block)}
        </div>
      ))}
    </div>
  )
}
