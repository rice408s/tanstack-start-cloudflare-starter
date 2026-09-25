import type { StackIconSlug } from '@/components/marketing/stack-icons'
import type { TermLine } from './terminal'

/**
 * Copy is ALWAYS a thunk, never a string.
 *
 * `src/config/landing.ts` is evaluated once per isolate at import time, but
 * the locale is per REQUEST — a bare `m.marketing_hero_title()` there would
 * freeze whichever locale happened to load the module first and serve it to
 * everyone (the same trap as localizing inside a server function). Wrapping
 * it defers the call to render, where Paraglide knows who is asking.
 */
export type Text = () => string

/** Kicker, title and optional lead — every block that has a heading. */
interface Head {
  kicker: Text
  title: Text
  lead?: Text
}

/**
 * Which ground the block sits on. Alternating a few `sheet` blocks into a
 * page of `plain` ones is what gives a long landing page a vertical rhythm
 * without a single image; see `Section` in section.tsx.
 */
interface Tone {
  tone?: 'plain' | 'sheet'
}

/**
 * The page's vocabulary. One member per block shape, discriminated on
 * `type` — add a shape by adding a member here, a component in a file of
 * its own (exported through blocks.tsx) and a case in render.tsx, and
 * TypeScript will not let you forget the third.
 */
export type LandingBlock =
  /** The first screen: claim, one line of what it is, two things to do. */
  | { type: 'hero'; title: Text; subtitle: Text }
  /**
   * A row (or rows) of brand marks under the hero — the stack, the agents it
   * works with. `label` is a small kicker above the marks. An entry with no
   * `icon` renders as its name alone (a brand simple-icons does not carry).
   */
  | {
      type: 'logos'
      label?: Text
      rows: { name: string; icon?: StackIconSlug }[][]
    }
  /** Big numbers. Each rolls up from zero when the band enters view. */
  | ({
      type: 'stats'
      items: { value: number; suffix?: string; label: Text }[]
    } & Tone)
  /** A shell recording. Prefer at least one `{ out }` line per block. */
  | ({ type: 'terminal'; label?: Text; lines: TermLine[] } & Head & Tone)
  /**
   * THE CENTREPIECE. A full-bleed, dark band `items.length` screens tall,
   * holding one screen-sized product screenshot that swaps as the reader
   * scrolls. It is the only block on the page that changes ground, and the
   * only one that costs more than a screen — both deliberate: it is the
   * thing a reader is meant to stop at. Reduced-motion readers get the same
   * screenshots as a plain stack.
   *
   * `image` is a filename stem under `public/marketing/` (see shot.tsx);
   * `bun run capture:marketing` regenerates every one of them from the real
   * app, so adding a surface means adding an entry to that script too.
   */
  | {
      type: 'surfaces'
      /** Optional, and off by default: over a screen-sized screenshot the
       *  title is doing all the work and a label above it is just noise. */
      kicker?: Text
      title: Text
      items: { image: string; alt: Text; label: Text; body: Text }[]
    }
  /**
   * Proof by output: what people built with it. Empty `items` renders
   * nothing, which is the honest default for a fresh clone — never seed it
   * with an invented product to make the section look full.
   */
  | ({
      type: 'gallery'
      items: { title: Text; body: Text; href?: string }[]
    } & Head &
      Tone)
  /**
   * What other people say, as two rows of cards drifting in opposite
   * directions. The default page ships PLACEHOLDER people — invented names,
   * `example.com` addresses, CC0 illustrated avatars — so replace every item
   * with a real customer's words (with their permission) or delete the block
   * before launch. `avatar` is a path under `public/`; without one the card
   * falls back to `initials`. Never a real person's photo lifted from the web.
   */
  | ({
      type: 'testimonials'
      items: {
        quote: Text
        name: string
        /** Second line under the name — shown when there is no `email`. */
        role?: Text
        email?: string
        avatar?: string
        initials: string
      }[]
    } & Head &
      Tone)
  /**
   * What is in the box, as a ledger: one row per module, a number and a
   * name on the left, and the things it ships as short chips on the right —
   * a brand mark where the thing IS a brand. No paragraphs: a reader scans
   * a row in a second and opens `path` if they want the rest. Replaced a
   * `bento` of six same-looking cards with a paragraph in each.
   */
  | ({
      type: 'modules'
      items: {
        title: Text
        facts: { label: Text; icon?: StackIconSlug }[]
        path?: string
      }[]
    } & Head &
      Tone)
  /** An uneven grid. `span` is out of 6 columns on large screens. */
  | ({
      type: 'bento'
      items: { title: Text; body: Text; path?: string; span?: 2 | 3 | 4 | 6 }[]
    } & Head &
      Tone)
  /**
   * Numbered steps side by side, each a short title over its own shell
   * block. `marks` is an optional row of brand marks under the heading (the
   * agents the steps are run with); an entry with no `icon` is a name alone.
   */
  | ({
      type: 'steps'
      marks?: { name: string; icon?: StackIconSlug }[]
      steps: { title: Text; body?: Text; lines: TermLine[] }[]
    } & Head &
      Tone)
  /** A comparison table. Every row's `cells` must match `columns` in length. */
  | ({
      type: 'compare'
      columns: Text[]
      rows: { label: Text; cells: Text[] }[]
    } & Head &
      Tone)
  /**
   * Grouped name chips, with a brand mark where one exists. Prefer
   * `logos-grouped` — this shape spends sentences on what a mark says for
   * free; it is kept for groups whose members have no mark at all.
   */
  | ({
      type: 'chips'
      groups: { group: Text; names: { name: string; icon?: StackIconSlug }[] }[]
    } & Head &
      Tone)
  /** The same grouping as `chips`, carried by marks instead of prose. */
  | ({
      type: 'logos-grouped'
      groups: { group: Text; names: { name: string; icon: StackIconSlug }[] }[]
    } & Head &
      Tone)
  /** The tiers, read straight from src/config/plans.ts. */
  /** Folding questions. */
  | ({ type: 'faq'; items: { q: Text; a: Text }[] } & Head & Tone)
  /** The last thing the page says, and the action that follows it. */
  | { type: 'cta'; title: Text; docs: Text }
