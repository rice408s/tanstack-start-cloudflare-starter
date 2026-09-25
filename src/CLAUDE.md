# Design language (src/)

This scopes design/visual conventions for anything under `src/` —
components, routes, styles. It supersedes dark-first + amber (retired
2026-09-15), which superseded mono + lavender, which superseded sage-studio.

Current direction (user-confirmed 2026-09-15): **neutral + blue, three
colour layers**. The base is black / white / grey with no hue in it. One
blue is the brand. Colour beyond that exists only where it MEANS something —
a status, a series, a category. The page carries no colour of its own;
contrast does the work.

The previous direction inverted this (two visibly tinted grounds, amber
accent, dark by default) and the note explaining why is worth keeping even
though the decision was reversed: an earlier pass at chroma 0.008 read as
"grey but slightly off", which is the worst of both. If you tint, tint
enough to see. The resolution this time is the opposite one — tint NOTHING
except two named marketing planes, and let them be honestly warm.

## This document describes ONE theme

Everything below is the **shipkit** look — the one the template ships with,
written into `:root` / `.dark` in `src/styles.css`. It is the default and the
reference, and a change to the product's own design belongs here.

It is not the only look available. `src/config/themes.ts` registers four
built-in visual styles (shipkit, editorial, soft, brutal) and
`src/styles/themes.css` holds the other three — each a full style, with its
own palette, radius, border weight, surface texture and typeface, in both
light and dark. The rules below (no colour beyond meaning, pill buttons,
near-zero shadows, sans-serif) are THIS theme's rules; an alternate theme may
break any of them on purpose, and the editorial and brutal ones do.

What binds all of them is the mechanism, and that rule has no exceptions: **a
theme is tokens, never a branch in a component.** No component reads
`data-theme`, and none may. A look that needs a component to change shape
needs a token for that shape — that is why the pill and the card corner are
`--radius-btn` and `--radius-card` now, and why `--brand-foreground` exists
instead of a hardcoded near-white (the brutal theme's yellow carries black
text). The two axes stay apart: `data-theme` is the style, the `dark` class
is the mode, and every theme owes both faces.

**Light is the default mode** (user-confirmed 2026-09-17): `defaultTheme="light"`
in `src/routes/__root.tsx`, whatever the visitor's OS says; the toggle's
explicit choice wins from then on.

## Rules

0. **Third-party brand marks are the one exception to every colour rule
   below** (user-confirmed 2026-09-11). Logos on marketing surfaces render in
   their own brand colour, generated into
   `src/components/marketing/stack-icons.ts` by
   `scripts/generate-stack-icons.mjs`. Each mark carries a colour per ground
   because several brand colours are pure black or pure white and would
   vanish on one of them. Nothing else takes colour from a brand: labels
   beside a mark stay grey, and the chip around it stays `--surface`.
1. **Text is ONLY the near-white, ink, or grey tokens, and they are pure
   neutral** (chroma 0, no hue residue). Light: ink `oklch(0.18 0 0)` +
   grey `oklch(0.5 0 0)`. Dark: `oklch(0.97 0 0)` + `oklch(0.72 0 0)`.
   No accent-coloured text anywhere — status and semantic colour go on
   FILLS, with near-white text on top.
2. **Grounds are neutral, full stop, in the light theme.** Every background,
   card, border and secondary fill is chroma 0. `--band` — the landing
   page's full-bleed centrepiece — is plain white there, 1.03:1 against the
   page: a step you can measure and not one you can see. It got there by
   being walked down three times (near-black, which read as a different
   site; 0.94; 0.96 warm), and the lesson is that four screens is long
   enough that ANY tint stops being an accent and becomes the page. What
   marks that block out is its content: four screen-sized shots of the
   product. The dark theme keeps a real plane (chroma 0.008 hue 80) because
   white is not available to it. In both themes a raised surface is LIGHTER
   than the page. **All colours are solid** — no
   alpha-composited text or surfaces; alpha only where physically required
   (overlay backdrops, the nav bar's blur, shadows).
3. **`--brand` is one blue, and it is a FILL under near-white text.**
   `oklch(0.54 0.17 255)` light / `oklch(0.55 0.175 255)` dark, with
   `--brand-foreground` near-white on both (4.99:1 and 4.78:1). Use it for
   the primary call to action, the focus ring and the selected state. Never
   as a text colour, never as a large page background. `--primary` is ink
   (near-white in dark) — **the default button is monochrome; brand is the
   exception, not the default.**
4. **Colour beyond the brand must MEAN something.** `--success` /
   `--warning` / `--danger` are status fills, each with its own near-white
   text token. `--chart-1…5` is a five-hue series ramp. That is the whole
   list. No decorative colour, no coloured section backgrounds, no
   gradients (a repeating radial-gradient used to DRAW a pattern — the hero
   dot grid — is a pattern, not a colour gradient).
5. **Every text/background pair holds WCAG AA (≥4.5:1), and every fill sits
   inside the sRGB gamut — both verified by calculation** (OKLCH → linear
   sRGB → relative luminance), never by eye. The computed ratios are written
   into the comments in `styles.css`; re-run the math before changing a
   value. Watch the gamut ceiling: hue 75 leaves sRGB at chroma 0.109, which
   is why `--warning` is capped at 0.105.
6. **Pill buttons — in THIS theme.** `Button`
   (`src/components/ui/button.tsx`) is `rounded-[var(--radius-btn)]` at the
   base of `buttonVariants`, for every variant and size, and a CTA-styled
   link written by hand takes the same token rather than `rounded-full`.
   `--radius-btn` is `9999px` here; a square-cornered theme sets it to 0.
   Genuine circles — avatars, status dots, the switch — keep `rounded-full`,
   because they are circles, not controls whose corner is a style choice.
7. **Soft radius everywhere else.** `--radius` in `src/styles.css` drives
   cards/inputs/selects via `rounded-md`/`lg`/`xl`, and `--radius-card` the
   card itself. Marketing section "sheets" use `rounded-3xl` on `--surface`.
8. **Sans-serif base (Manrope), plus display faces for marketing.**
   `.display-sans` (Bricolage Grotesque) carries the hero AND every section
   heading on marketing surfaces — a page that establishes a voice on screen
   one and drops it on screen two has no voice. `.display-serif`
   (Instrument Serif italic) may style one or two accent words inside a large
   heading — never body text, never the app shell. Marketing type runs to two
   sizes, display-huge and body-small, with as little as possible in between:
   a gentle gradient of sizes is what makes a long page read flat. Mono
   (`--font-mono`) is for actual code only.
9. **Whitespace and tinted fills group content; lines are rare.** Prefer
   spacing and solid tinted blocks (`bg-secondary`, `bg-surface`) over
   `border`/`divide-*` hairlines — including in tables, where an alternating
   row tint beats rules. Hairlines only on functional edges: sticky header
   bottom, footer top, inputs, dropdown/popover panels. Shadows near-zero.
   No glassmorphism, no emoji decoration. The marketing nav bar is the one
   place alpha lands on a surface: `bg-background/75` plus a wide
   `backdrop-blur`, both behind `supports-[backdrop-filter]:` with a solid
   `bg-background` base, so a browser without backdrop-filter gets a readable
   bar rather than a see-through one.
   **In the app shell and admin console this rule has a budget: one tinted
   layer per page, and only for a thing that must read as an object (a plan
   to buy, a key just issued, a form being drafted).** Grouping is done by
   headings, spacing and hairlines — `Panel`/`AdminSection` are plain by
   default, KPIs sit in a `StatStrip`, settings are form rows, tables are
   zebra-striped. Console scale: page title `text-2xl` bold (weight, not size, sets it off from the semibold section headings), table rows 40px,
   `rounded-lg`. **Every in-app page is full-width and left-aligned** — no
   `mx-auto max-w-*` page wrappers (user-confirmed 2026-09-16: a centred
   column beside full-width tables, or a capped column hugging the left
   edge, both read as a different app). Forms keep label-left /
   control-right rows; a grid of buyable objects sizes its cells with
   `auto-fill`, never the page. `rounded-2xl` + `p-6` grey blocks are marketing sheets and
   do not belong in a working screen (user-confirmed 2026-09-16, after the
   console had become a wall of one-number cards).
10. **`.kicker` labels are small uppercase Manrope**; marketing sections may
    use the chip variant (`kicker` + `rounded-lg bg-surface px-3 py-2`).
11. When adding a new `src/components/ui/*` primitive: strip the
    focus-visible ring glow (border-color-only focus), and take radius from
    `--radius`.

## Where things live

- Color/radius/font tokens: `src/styles.css` (`:root` / `.dark` OKLCH
  variables, `@theme inline` block for Tailwind wiring). Tokens worth
  knowing: `--brand`/`--brand-foreground` (the blue fill + its near-white
  text), `--success`/`--warning`/`--danger` and their foregrounds (status
  fills), `--chart-1…5` (series ramp), `--surface` (sheet/chip tint one step
  below `--secondary`), `--band`/`--band-foreground`/`--band-muted` (the
  landing page's one full-bleed plane), `--hero-dot` (the first screen's dot
  grid, drawn by `.hero-dots`), `--terminal`/`--terminal-foreground`/
  `--terminal-muted` (the marketing shell block — a dark code surface on both
  grounds, deliberately softer than `--foreground` + white, which reads as a
  hole punched in the page), `--placeholder` (input placeholder grey —
  lighter than `--muted-foreground` and deliberately sub-AA: transitional
  text), `--media` and `--media-foreground`/`--media-muted` (near-black
  ground behind generated images and video — the one token with no `.dark`
  override, because media is judged against a constant).
- Contrast math scratch script (session tool, not checked in):
  compute OKLCH → relative luminance → contrast ratio, and check the sRGB
  gamut, before changing any token.
- Shared primitives: `src/components/ui/*`.
- Display serif: `public/fonts/instrument-serif-italic-latin.woff2`,
  `.display-serif` in `src/styles.css`.
- Style review page: `/test` (dev-only, `src/routes/test.tsx`) — check it
  after any token or primitive change.
- Marketing block palette: `/blocks` (dev-only, `src/routes/blocks.tsx`) —
  every landing-page block shape with sample data. Check it after touching
  `src/components/marketing/blocks/`.
