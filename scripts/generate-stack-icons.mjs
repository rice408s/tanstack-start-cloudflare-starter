/**
 * Inlines the brand marks the marketing stack section draws.
 *
 * simple-icons ships ~3000 icons; importing it from a route would drag the
 * whole set into the client bundle. This writes only the slugs listed below
 * into src/components/marketing/stack-icons.ts, which is what the page
 * imports. Run it after editing SLUGS:
 *
 *   node scripts/generate-stack-icons.mjs
 *
 * A slug that simple-icons does not carry (Creem and Paraglide, at the time
 * of writing) has no mark — the stack row renders those as a name on its own,
 * which is deliberate, not a bug.
 */
import { writeFileSync } from 'node:fs'
import * as si from 'simple-icons'

/**
 * A brand colour is only usable on a ground it contrasts with. Four of these
 * marks are pure black (shadcn/ui, Bun, Resend, MDX) and would vanish on the
 * dark ground; Better Auth is pure white and would vanish on the light one,
 * and TanStack and Drizzle are pale enough to be hard to read there. So each
 * mark carries a colour per ground: its own where that works, and the ground's
 * own ink or white where it does not.
 */
const luminance = (hex) => {
  const n = Number.parseInt(hex, 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Ink and white, matching --foreground in each theme. */
const INK = '3D3D3D'
const WHITE = 'FBFBFB'
/** Below this a mark is lost on the dark ground; above it, on the light one. */
const TOO_DARK = 0.12
const TOO_LIGHT = 0.7

/** Biome formats this repo with single quotes; emit them so `check` passes. */
const q = (value) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

/** slug used in STACK -> simple-icons export name. */
const SLUGS = {
  tanstack: 'siTanstack',
  react: 'siReact',
  tailwindcss: 'siTailwindcss',
  shadcnui: 'siShadcnui',
  cloudflareworkers: 'siCloudflareworkers',
  drizzle: 'siDrizzle',
  cloudflare: 'siCloudflare',
  betterauth: 'siBetterauth',
  stripe: 'siStripe',
  resend: 'siResend',
  typescript: 'siTypescript',
  vite: 'siVite',
  bun: 'siBun',
  mdx: 'siMdx',
  google: 'siGoogle',
  github: 'siGithub',
  vitest: 'siVitest',
  nodedotjs: 'siNodedotjs',
  // Coding agents, for the row in the landing page's agent section.
  claude: 'siClaude',
  cursor: 'siCursor',
  githubcopilot: 'siGithubcopilot',
  windsurf: 'siWindsurf',
  opencode: 'siOpencode',
  zed: 'siZedindustries',
  amp: 'siAmp',
}

/**
 * Marks simple-icons does not carry, in the same shape. simple-icons removed
 * OpenAI's at OpenAI's request, so the ChatGPT knot Codex is shown with comes
 * from Lobe Icons (@lobehub/icons-static-svg 1.95.0, MIT). Creem's mark is
 * the symbol path from its own brand kit (creem.io/new-branding, "creem
 * logo_black_full.svg"), which is drawn on a larger canvas — hence
 * `viewBox`. `evenodd` marks a path drawn for that fill rule — the knot's
 * inner cut-outs fill solid without it.
 */
const EXTRA = {
  creem: {
    title: 'Creem',
    hex: '151617',
    viewBox: '8 9 103 103',
    path: 'M21.1102 11C23.1187 11.0001 24.9669 12.0982 25.9281 13.8619L50.2059 58.4106C51.5699 60.9134 54.7048 61.8368 57.2077 60.473C59.7108 59.109 60.6342 55.9742 59.2701 53.4712L40.5466 19.113C38.554 15.4566 41.2004 11 45.3645 11H102.806C106.885 11 109.539 15.2933 107.715 18.9416L64.0579 106.254C62.0356 110.298 56.2654 110.298 54.2431 106.254L10.5863 18.9416C8.76212 15.2933 11.4156 11 15.4946 11H21.1102Z',
  },
  openai: {
    title: 'OpenAI',
    hex: '000000',
    evenodd: true,
    path: 'M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z',
  },
}

const OUT = 'src/components/marketing/stack-icons.ts'

const icons = [
  ...Object.entries(SLUGS).map(([slug, key]) => {
    const icon = si[key]
    if (!icon) throw new Error(`simple-icons has no export named ${key}`)
    return [slug, icon]
  }),
  ...Object.entries(EXTRA),
]

const entries = icons.map(([slug, icon]) => {
  const L = luminance(icon.hex)
  return [
    `  ${slug}: {`,
    `    title: ${q(icon.title)},`,
    `    light: ${q(`#${L > TOO_LIGHT ? INK : icon.hex}`)},`,
    `    dark: ${q(`#${L < TOO_DARK ? WHITE : icon.hex}`)},`,
    `    evenodd: ${icon.evenodd === true},`,
    `    viewBox: ${q(icon.viewBox ?? '0 0 24 24')},`,
    `    path: ${q(icon.path)},`,
    '  },',
  ].join('\n')
})

const file = `// Generated from the simple-icons package (a devDependency) — do not edit by
// hand. Only the marks this page uses are inlined, so the 3000-icon package
// never reaches the client bundle. To add one, put its slug in the list at
// the top of scripts/generate-stack-icons.mjs and run:
//
//   node scripts/generate-stack-icons.mjs
//
// Each mark carries its brand colour once per ground: \`light\` for the light
// theme, \`dark\` for the dark one. They differ only where the brand colour
// would be invisible or unreadable on that ground — see the note in the
// generator. Brand marks are the one place the page shows colour; rule 1 in
// src/CLAUDE.md governs text and surfaces, not third-party logos.

export type StackIconSlug = keyof typeof STACK_ICONS

export const STACK_ICONS = {
${entries.join('\n')}
} as const
`

writeFileSync(OUT, file)
console.log(`wrote ${OUT} (${icons.length} marks)`)
