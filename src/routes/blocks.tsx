import { createFileRoute } from '@tanstack/react-router'
import { LandingBlocks } from '@/components/marketing/blocks/render'
import type { LandingBlock } from '@/components/marketing/blocks/types'

// Dev-only palette: every marketing block shape rendered with sample data, so
// the shapes that are NOT on the default landing page have somewhere to be
// seen — and somewhere to rot loudly instead of quietly. `src/config/landing.ts`
// ships nine of the fifteen shapes; this page ships all of them.
//
// Copy here is plain English strings rather than Paraglide messages on
// purpose (same call as `/test`): this is a workbench, not a product surface,
// and sample copy in the message files would be sample copy every real app
// then has to delete.
//
// Pick a shape, copy its object into `landing.ts`, swap the strings for
// `() => m.your_key()`.

export const Route = createFileRoute('/blocks')({
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: import.meta.env.DEV ? BlockPalette : NotAvailable,
})

function NotAvailable() {
  return null
}

const t = (s: string) => () => s

const SAMPLES: readonly LandingBlock[] = [
  {
    type: 'stats',
    tone: 'sheet',
    items: [
      { value: 1, label: t('runtime, in dev and in production.') },
      { value: 0, label: t('connection strings to paste.') },
      { value: 12, label: t('vertical slices, every one deletable.') },
      { value: 2, label: t('payment providers, one event type.') },
    ],
  },
  {
    type: 'modules',
    kicker: t('modules'),
    title: t('A ledger of what ships.'),
    items: [
      {
        title: t('A row per module'),
        path: 'src/features/example',
        facts: [
          { label: t('Stripe'), icon: 'stripe' },
          { label: t('Short chips, not paragraphs') },
          { label: t('A mark where the chip is a brand') },
        ],
      },
      {
        title: t('Rows differ by their chips'),
        facts: [
          { label: t('Three here') },
          { label: t('Five there') },
          { label: t('The reader compares') },
          { label: t('Nobody reads a card') },
          { label: t('Path is optional') },
        ],
      },
    ],
  },
  {
    type: 'bento',
    kicker: t('bento'),
    title: t('An uneven grid.'),
    items: [
      {
        span: 4,
        title: t('A wide cell leads'),
        body: t('Spans are out of six columns; every row must add up to six.'),
        path: 'src/features/auth',
      },
      { span: 2, title: t('A narrow one follows'), body: t('4 + 2.') },
      { span: 3, title: t('Then a pair'), body: t('3 + 3.') },
      {
        span: 3,
        title: t('Of equal width'),
        body: t('An even grid reads as a list.'),
      },
    ],
  },
  {
    type: 'steps',
    tone: 'sheet',
    kicker: t('steps'),
    title: t('Numbered steps, side by side.'),
    steps: [
      {
        title: t('First step'),
        body: t('An optional body line under the title.'),
        lines: ['bun install', 'bun run dev'],
      },
      {
        title: t('Second step'),
        body: t('The shell blocks share a height across the row.'),
        lines: ['/deploy'],
      },
    ],
  },
  {
    type: 'compare',
    kicker: t('compare'),
    title: t('A table, for a choice.'),
    columns: [t('This one'), t('That one')],
    rows: [
      {
        label: t('Rows are tinted'),
        cells: [t('Not ruled.'), t('Fills group, lines are rare.')],
      },
      {
        label: t('Cells are fragments'),
        cells: [t('Not sentences.'), t('The label asked the question.')],
      },
      {
        label: t('It scrolls sideways'),
        cells: [t('Inside its own box.'), t('The page body never does.')],
      },
    ],
  },
  {
    type: 'logos-grouped',
    kicker: t('logos-grouped'),
    title: t('The stack, carried by marks.'),
    groups: [
      {
        group: t('App'),
        names: [
          { name: 'TanStack Start', icon: 'tanstack' },
          { name: 'React', icon: 'react' },
          { name: 'Tailwind CSS', icon: 'tailwindcss' },
        ],
      },
      {
        group: t('Platform'),
        names: [
          { name: 'Cloudflare Workers', icon: 'cloudflareworkers' },
          { name: 'Drizzle', icon: 'drizzle' },
        ],
      },
      {
        group: t('Services'),
        names: [
          { name: 'better-auth', icon: 'betterauth' },
          { name: 'Stripe', icon: 'stripe' },
          { name: 'Resend', icon: 'resend' },
        ],
      },
    ],
  },
  {
    type: 'chips',
    kicker: t('chips'),
    title: t('Names, where there is no mark.'),
    groups: [
      {
        group: t('Not in simple-icons'),
        names: [
          { name: 'Creem' },
          { name: 'Paraglide' },
          { name: 'D1', icon: 'cloudflare' },
        ],
      },
    ],
  },
  {
    type: 'gallery',
    kicker: t('gallery'),
    title: t('Proof by output.'),
    items: [
      {
        title: t('Something somebody shipped'),
        body: t(
          'Real launches only. An empty list renders nothing, which is the honest default.',
        ),
        href: 'https://example.com',
      },
      {
        title: t('And another'),
        body: t(
          'A reader can check these, which is why they beat a feature list.',
        ),
      },
    ],
  },
  {
    type: 'testimonials',
    kicker: t('testimonials'),
    title: t('Quotes — real ones, or none.'),
    items: [
      {
        quote: t(
          'Sample text, on a dev-only page. Never ship this block with invented quotes: a template that deploys placeholder testimonials makes every clone of it publish fabricated ones.',
        ),
        name: 'Sample Person',
        role: t('Sample role, example.com'),
        initials: 'SP',
      },
    ],
  },
  {
    type: 'faq',
    kicker: t('faq'),
    title: t('Folding questions.'),
    items: [
      {
        q: t('Where does this shape belong?'),
        a: t(
          'Usually in the docs. An FAQ on a landing page is often a confession that the page above it did not land.',
        ),
      },
      { q: t('How many?'), a: t('Four, at the outside.') },
    ],
  },
]

function BlockPalette() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
        <p className="kicker">Dev only</p>
        <h1 className="display-sans mt-3 text-5xl leading-[0.95]">
          Block palette
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Every marketing block shape, with sample data. The default landing
          page uses nine of them; copy any object out of{' '}
          <code className="font-mono text-base">src/routes/blocks.tsx</code>{' '}
          into{' '}
          <code className="font-mono text-base">src/config/landing.ts</code> and
          swap the strings for message thunks.
        </p>
      </div>
      <LandingBlocks blocks={SAMPLES} />
    </div>
  )
}
