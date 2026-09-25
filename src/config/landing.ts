import type { LandingBlock } from '@/components/marketing/blocks/types'
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// The landing page, as data.
//
// THIS FILE IS MEANT TO BE GUTTED. It is the template's own pitch, and none
// of it is yours. The route that renders it (`src/routes/_marketing/index.tsx`)
// holds no copy and no layout — it maps over the array below. So:
//
//   reorder a section   move a line
//   remove a section    delete a line
//   add a section       add a line, with a block shape from
//                       `src/components/marketing/blocks/types.ts`
//
// THE SHAPE OF THIS PAGE — claim, proof, contents, doubts, door.
//
// The positioning is AGENT-FIRST: a starter written so a coding agent can
// set it up, extend it and not break it. The hero says so, and the block
// under the stack names the agents and shows three sessions with one.
//
// Seven blocks, in the order a developer sizing up a starter asks their
// questions: what is it (hero), is it built on things I know (logos), will
// my agent get it (steps), is it real (surfaces), what is in it (modules),
// what am I still unsure about (faq), and the door (cta). Every block
// answers exactly one of those. `/blocks` (dev only) shows the other shapes
// you can add: stats, bento, compare, chips, gallery, testimonials, terminal.
//
// THE RHYTHM. The page alternates grounds so the eye gets a beat: the dotted
// fold, a grey sheet (steps), the one full-bleed band (surfaces), then the
// page ground to the end. Never two sheets in a row, and never a sheet under
// a block whose own cards are `bg-surface` — they would vanish into it.
//
// FOUR RULES WORTH KEEPING
//
// 1. Every string is a THUNK (`() => m.key()`), never a bare call. This
//    module is evaluated once per isolate; the locale is per request. A bare
//    call here would freeze whichever locale loaded the module first and
//    serve it to everybody.
// 2. No `lead` on the default page. A headline that needs a paragraph under
//    it to land is a headline that needs rewriting. The prop still exists
//    for palette blocks; a lead on every one of them is what made an earlier
//    version of this page tiring.
// 3. One block is full-bleed, and only one. `surfaces` runs edge to edge on
//    `--band`, which in the light theme is white: at four screens tall, any
//    tint stops reading as a section and starts reading as a second site,
//    so the shots mark the block out rather than the ground does. The dark
//    theme keeps a real plane there. Note that blocks whose own cards are
//    `bg-surface` (modules, bento, chips, faq, compare, gallery,
//    testimonials) must stay `tone: 'plain'` — their cards would disappear
//    into a `sheet` band.
// 4. The screenshots are COMMITTED, under `public/marketing/`, one light
//    and one dark file per shot (<name>-light.webp, <name>-dark.webp). Swap
//    them for your own product's screens before launch.
// ---------------------------------------------------------------------------

export const landing: readonly LandingBlock[] = [
  // ── Screen 1: the claim ───────────────────────────────────────────────
  {
    type: 'hero',
    title: () => m.marketing_hero_title(),
    subtitle: () => m.marketing_hero_subtitle(),
  },

  // The stack, as marks. It answers "is this built on things I know" before
  // the reader has to ask.
  {
    type: 'logos',
    label: () => m.marketing_stack_label(),
    rows: [
      [
        { name: 'TanStack Start', icon: 'tanstack' },
        { name: 'React', icon: 'react' },
        { name: 'TypeScript', icon: 'typescript' },
        { name: 'Tailwind CSS', icon: 'tailwindcss' },
        { name: 'shadcn/ui', icon: 'shadcnui' },
      ],
      [
        { name: 'Cloudflare', icon: 'cloudflare' },
        { name: 'Drizzle', icon: 'drizzle' },
        { name: 'better-auth', icon: 'betterauth' },
        { name: 'Vite', icon: 'vite' },
        { name: 'Bun', icon: 'bun' },
        { name: 'Resend', icon: 'resend' },
      ],
    ],
  },

  // ── With your agent ───────────────────────────────────────────────────
  // The agents the repo is written for (CLAUDE.md for Claude Code, AGENTS.md
  // for the rest — only list a tool that reads one of them), then three short
  // sessions with one. `>` is what you say, `●` what the agent did, gray what
  // came back. Keep each line true to its skill (.claude/skills) and to the
  // check it names: step 3 is src/core/rules.test.ts.
  {
    type: 'steps',
    tone: 'sheet',
    kicker: () => m.marketing_steps_kicker(),
    title: () => m.marketing_steps_title(),
    marks: [
      { name: 'Claude Code', icon: 'claude' },
      { name: 'Codex', icon: 'openai' },
      { name: 'Cursor', icon: 'cursor' },
      { name: 'GitHub Copilot', icon: 'githubcopilot' },
      { name: 'Windsurf', icon: 'windsurf' },
      { name: 'opencode', icon: 'opencode' },
      { name: 'Zed', icon: 'zed' },
      { name: 'Amp', icon: 'amp' },
    ],
    steps: [
      {
        title: () => m.marketing_step_1_title(),
        lines: [
          { ask: () => '/setup' },
          { did: 'bun install' },
          { did: 'bun run db:migrate:local' },
          { did: 'bun run dev' },
          { out: 'http://localhost:3000/' },
        ],
      },
      {
        title: () => m.marketing_step_2_title(),
        lines: [
          { ask: () => '/google-oauth' },
          { did: 'Wrote GOOGLE_CLIENT_ID to .dev.vars' },
          { did: 'Set appConfig.googleClientId' },
          { did: 'Restarted the dev server' },
          { out: 'Continue with Google ✓' },
        ],
      },
      {
        title: () => m.marketing_step_3_title(),
        lines: [
          { ask: () => m.marketing_step_3_ask() },
          { did: 'createServerFn in features/notes' },
          { out: '✗ not built from authedFn' },
          { did: 'Rebuilt it on authedFn' },
          { out: '✓ all tests pass' },
        ],
      },
    ],
  },

  // ── The proof ─────────────────────────────────────────────────────────
  // The real app, swapping as the reader scrolls. `image` names a file pair
  // in public/marketing (<name>-light.webp / <name>-dark.webp).
  {
    type: 'surfaces',
    title: () => m.marketing_surfaces_title(),
    items: [
      {
        image: 'app',
        alt: () => m.marketing_surface_dashboard_alt(),
        label: () => m.marketing_surface_dashboard(),
        body: () => m.marketing_surface_dashboard_body(),
      },
      {
        image: 'account',
        alt: () => m.marketing_surface_account_alt(),
        label: () => m.marketing_surface_account(),
        body: () => m.marketing_surface_account_body(),
      },
      {
        image: 'site',
        alt: () => m.marketing_surface_marketing_alt(),
        label: () => m.marketing_surface_marketing(),
        body: () => m.marketing_surface_marketing_body(),
      },
    ],
  },

  // ── What is in it ─────────────────────────────────────────────────────
  // The contents, as a ledger: a name and the directory it lives in on the
  // left, what it ships as short chips on the right, so every claim is
  // something the reader can open. The last row is what this starter
  // deliberately leaves out.
  {
    type: 'modules',
    kicker: () => m.marketing_box_kicker(),
    title: () => m.marketing_box_title(),
    items: [
      {
        title: () => m.marketing_box_auth_title(),
        path: 'src/features/auth',
        facts: [
          { label: () => m.marketing_mod_auth_code() },
          { label: () => 'Google', icon: 'google' },
          { label: () => 'GitHub', icon: 'github' },
          { label: () => m.marketing_mod_auth_nopass() },
          { label: () => m.marketing_mod_auth_sessions() },
        ],
      },
      {
        title: () => m.marketing_box_app_title(),
        path: 'src/routes/_app',
        facts: [
          { label: () => m.marketing_mod_app_dashboard() },
          { label: () => m.marketing_mod_app_account() },
          { label: () => m.marketing_mod_app_avatar(), icon: 'cloudflare' },
          { label: () => m.marketing_mod_app_export() },
          { label: () => m.marketing_mod_app_delete() },
        ],
      },
      {
        title: () => m.marketing_box_site_title(),
        path: 'src/config/landing.ts',
        facts: [
          { label: () => m.marketing_mod_site_blocks() },
          { label: () => m.marketing_mod_site_themes() },
          { label: () => m.marketing_mod_site_seo() },
          { label: () => m.marketing_mod_site_prerender() },
        ],
      },
      {
        title: () => m.marketing_box_content_title(),
        path: 'src/features/content',
        facts: [
          { label: () => m.marketing_chip_mdx(), icon: 'mdx' },
          { label: () => m.marketing_mod_content_blog() },
          { label: () => m.marketing_mod_content_build() },
          { label: () => m.marketing_chip_i18n() },
          { label: () => m.marketing_mod_content_url() },
        ],
      },
      {
        title: () => m.marketing_box_ops_title(),
        path: '.github/workflows/ci.yml',
        facts: [
          { label: () => m.marketing_mod_ops_check() },
          { label: () => m.marketing_mod_ops_unit(), icon: 'vitest' },
          { label: () => m.marketing_chip_e2e() },
          { label: () => m.marketing_mod_ops_rules() },
          { label: () => m.marketing_mod_ops_deploy() },
        ],
      },
      {
        title: () => m.marketing_box_more_title(),
        path: 'src/core',
        facts: [
          { label: () => m.marketing_chip_email(), icon: 'resend' },
          { label: () => m.marketing_mod_more_cron() },
          { label: () => m.marketing_mod_more_ratelimit() },
          { label: () => m.marketing_mod_more_headers() },
        ],
      },
      // What the free starter leaves out, and where it is.
      {
        title: () => m.marketing_box_pro_title(),
        path: 'shipkit.sh',
        facts: [
          { label: () => 'Stripe', icon: 'stripe' },
          { label: () => 'Creem' },
          { label: () => m.marketing_mod_pro_credits() },
          { label: () => m.marketing_mod_pro_admin() },
          { label: () => m.marketing_mod_pro_roles() },
          { label: () => m.marketing_mod_pro_keys() },
          { label: () => m.marketing_mod_pro_more() },
        ],
      },
    ],
  },

  // ── The doubts, then the door ─────────────────────────────────────────
  // The questions a reader still has AFTER the page above. An FAQ that
  // re-asks the page is a confession that the page did not land.
  {
    type: 'faq',
    kicker: () => m.marketing_faq_kicker(),
    title: () => m.marketing_faq_title(),
    items: [
      { q: () => m.marketing_faq_free_q(), a: () => m.marketing_faq_free_a() },
      {
        q: () => m.marketing_faq_shipkit_q(),
        a: () => m.marketing_faq_shipkit_a(),
      },
      {
        q: () => m.marketing_faq_stack_q(),
        a: () => m.marketing_faq_stack_a(),
      },
      { q: () => m.marketing_faq_cost_q(), a: () => m.marketing_faq_cost_a() },
    ],
  },

  {
    type: 'cta',
    title: () => m.marketing_cta_band(),
    docs: () => m.marketing_cta_band_docs(),
  },
]
