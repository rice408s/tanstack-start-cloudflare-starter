/**
 * The block components, one file each, re-exported for the renderer and the
 * `/blocks` palette. Every one takes its own member of the LandingBlock union
 * and nothing else — no block reaches for page-level state, and no
 * block contains a word of this template's copy. Everything they say comes
 * from `src/config/landing.ts` as a message thunk.
 *
 * The shared contract: a block never opens its own <section> (Section does
 * that, and hands back `inView`), and every entrance is movement and opacity
 * only. One block — `surfaces` — needs an asset, and the assets it needs are
 * regenerated from the running app by `bun run capture:marketing`.
 * (`testimonials` shows avatars when given them, initials when not.) Every
 * other block must stand up with none, so that a fresh clone is presentable
 * before anybody has run anything.
 *
 * What they share — the `Of<>` helper, the CTA target, the header height —
 * is in `shared.ts`; a block's own helpers live in the block's file.
 */
export { BentoBlock } from './bento'
export { ChipsBlock } from './chips'
export { CompareBlock } from './compare'
export { CtaBlock } from './cta'
export { FaqBlock } from './faq'
export { GalleryBlock } from './gallery'
export { HeroBlock } from './hero'
export { LogosBlock } from './logos'
export { LogosGroupedBlock } from './logos-grouped'
export { ModulesBlock } from './modules'
export { StatsBlock } from './stats'
export { StepsBlock } from './steps'
export { SurfacesBlock } from './surfaces'
export { TerminalBlock } from './terminal-block'
export { TestimonialsBlock } from './testimonials'
