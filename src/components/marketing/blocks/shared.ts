import { m } from '@/paraglide/messages'
import type { LandingBlock } from './types'

// What every block file shares. Kept to the three things that are genuinely
// cross-block — a block's own helpers live beside the block.

/** One member of the LandingBlock union, by its `type`. */
export type Of<T extends LandingBlock['type']> = Extract<
  LandingBlock,
  { type: T }
>

// The CTA destination is app structure, not page copy: it follows the
// waitlist gate rather than the landing config, so flipping appConfig.waitlist
// moves every call to action on the site at once.
export const ctaTo = '/dashboard'
export const ctaLabel = () => m.marketing_cta()

// The marketing header is `fixed` and 4rem tall (`src/routes/_marketing.tsx`),
// so anything that pins itself to the top has to start below it. Kept in px
// because the scroll maths needs a number, and matched to the `h-16` / `pt-16`
// on the header itself — change one, change all three.
export const HEADER_H = 64
