import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GooLoader } from '@/components/ui/goo-loader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollRevealText, useInView } from '@/lib/motion'

// Dev style-review page: every primitive and motion piece on one screen, so
// design tweaks can be judged without hunting for a live instance. Dev-only
// (hidden in production), English-only on purpose — not a product surface,
// so it skips Paraglide.

export const Route = createFileRoute('/test')({
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  component: import.meta.env.DEV ? TestPage : NotAvailable,
})

function NotAvailable() {
  return null
}

const BUTTON_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const

const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const

const SWATCHES = [
  ['background', 'bg-background border'],
  ['secondary', 'bg-secondary'],
  ['surface', 'bg-surface'],
  ['accent', 'bg-accent'],
  ['muted', 'bg-muted'],
  ['brand', 'bg-brand'],
  ['primary', 'bg-primary'],
  ['foreground', 'bg-foreground'],
  ['destructive', 'bg-destructive'],
] as const

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="kicker">{title}</h2>
      {children}
    </section>
  )
}

function AppearDemo() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const cls = (base: string) => `${base} ${inView ? 'in' : ''}`
  return (
    <div ref={ref} className="space-y-1.5">
      <div className="space-y-5 rounded-2xl bg-surface p-8">
        <p
          className={cls(
            'appear max-w-xl text-3xl font-medium leading-tight tracking-tight',
          )}
        >
          Entrance choreography
        </p>
        <p
          className={cls(
            'appear max-w-md text-sm leading-6 text-muted-foreground',
          )}
          style={{ '--appear-delay': '120ms' } as React.CSSProperties}
        >
          Elements rise in one after another — same easing, staggered delays.
          Chips pop with a slight overshoot.
        </p>
        <div className="flex gap-2">
          {['Images', 'Video', 'Skills', 'Credits'].map((label, i) => (
            <span
              key={label}
              className={cls(
                'appear-pop inline-flex h-8 items-center rounded-full bg-background px-4 text-sm font-medium',
              )}
              style={
                { '--appear-delay': `${240 + i * 80}ms` } as React.CSSProperties
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        entrance stagger — reload or scroll this block into view
      </p>
    </div>
  )
}

function TestPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Style test</h1>
        <p className="text-sm text-muted-foreground">
          Dev-only review page for primitives and motion.
        </p>
      </header>

      <Section title="Colors">
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="space-y-1.5">
              <div className={`h-14 w-24 rounded-lg ${cls}`} />
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Brand accent — lavender fill, black text, both grounds">
        <div className="overflow-hidden rounded-2xl border">
          <div className="flex flex-wrap items-center gap-4 bg-background p-4">
            <Button>Generate</Button>
            <span className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground">
              Upgrade
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-brand px-3 text-xs font-semibold text-brand-foreground">
              12 credits
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              gray secondary copy
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-foreground p-4">
            <span className="text-sm font-medium text-background">
              White heading
            </span>
            <span className="text-sm font-medium text-media-muted">
              gray secondary copy
            </span>
            <span className="inline-flex h-9 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground">
              Join now
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-brand px-3 text-xs font-semibold text-brand-foreground">
              New
            </span>
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <p className="text-2xl font-bold tracking-tight">
            Heading — bold 2xl
          </p>
          <p className="text-sm leading-7">
            Body — the quick brown fox jumps over the lazy dog. 视觉上中文与
            Manrope 混排的行高节奏也在这里确认。
          </p>
          <p className="text-xs text-muted-foreground">
            Muted caption — secondary information voice.
          </p>
          <p className="kicker">Kicker — structural micro-label</p>
          <p className="font-mono text-xs">mono — for actual code only</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <Button disabled>disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_SIZES.map((size) => (
              <Button key={size} size={size} variant="secondary">
                {size}
              </Button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="test-input">Input</Label>
            <Input id="test-input" placeholder="Placeholder text" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="test-textarea">Textarea</Label>
            <Textarea id="test-textarea" placeholder="Multi-line text" />
          </div>
          <div className="space-y-1.5">
            <Label>Select</Label>
            <Select defaultValue="one">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">Option one</SelectItem>
                <SelectItem value="two">Option two</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="test-switch" defaultChecked />
            <Label htmlFor="test-switch">Switch</Label>
          </div>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>
              Soft tinted blocks group content; hairlines are rare.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6">
            Card body content sits on the shared radius token.
          </CardContent>
        </Card>
      </Section>

      <Section title="Marketing type — experiment">
        <div className="space-y-10">
          {/* 1. Display heading: oversized, tight tracking, sub-1 leading,
              one serif-italic accent word. Marketing pages only. */}
          <div className="space-y-4">
            <p className="max-w-3xl text-6xl font-medium leading-[0.95] tracking-[-0.03em]">
              Ship your product without{' '}
              <span className="display-serif">overthinking</span>
            </p>
            <p className="text-xs text-muted-foreground">
              hero — 6xl medium · tracking -0.03em · leading 0.95 · serif accent
              word
            </p>
          </div>

          {/* 2. Two-tone heading: hierarchy inside one sentence via a solid
              secondary gray — no alpha. */}
          <div className="space-y-4">
            <p className="max-w-2xl text-3xl font-medium leading-tight tracking-tight text-foreground">
              Meet the template.{' '}
              <span className="text-muted-foreground">
                Auth, billing, credits and an admin console — wired up, and
                every part of it deletable.
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              section heading — lead foreground, continuation muted-foreground
            </p>
          </div>

          {/* 3. Kicker chip: the tinted-block version of .kicker for
              marketing sections. Solid fill. */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="kicker">Plain kicker</span>
              <span className="kicker rounded-lg bg-surface px-3 py-2 text-muted-foreground">
                Chip kicker
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              kicker vs chip kicker — solid bg-surface fill, radius-lg
            </p>
          </div>

          {/* 4. Dark sheet: a full-width rounded section card, hierarchy by
              solid gray steps on ink. Candidate for the marketing footer/CTA
              band. */}
          <div className="space-y-1.5">
            <div className="space-y-6 rounded-3xl bg-foreground p-10 text-white">
              <span className="kicker rounded-lg bg-terminal px-3 py-2 text-media-muted">
                Dark sheet
              </span>
              <p className="max-w-xl text-3xl font-medium leading-tight tracking-tight">
                For days when the blank repo feels{' '}
                <span className="display-serif">too loud</span>
              </p>
              <p className="max-w-md text-sm leading-6 text-media-muted">
                Secondary copy is a solid gray step on the ink sheet — no second
                hue, no alpha, hierarchy is all value.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              dark section sheet — bg-foreground, rounded-3xl
            </p>
          </div>
        </div>
      </Section>

      <Section title="Scroll motion — experiment (jitter.video-inspired)">
        <div className="space-y-14">
          {/* 1. Entrance stagger: fade+rise text/cards, scale-pop chips.
              One-shot when the block scrolls into view. */}
          <AppearDemo />

          {/* 2. Scroll-linked word reveal: words light up border → foreground
              as the paragraph crosses the viewport. */}
          <div className="space-y-1.5">
            <ScrollRevealText
              className="max-w-2xl text-3xl font-medium leading-tight tracking-tight"
              text="Auth, payments, credits and an admin console come wired together, so the only code you write is the part that is actually yours."
            />
            <p className="text-xs text-muted-foreground">
              scroll word reveal — scroll up/down through this block
            </p>
          </div>

          {/* 3. Sticky stacking cards: each card pins slightly lower than the
              previous, so they stack while scrolling. */}
          <div className="space-y-1.5">
            <div className="space-y-6">
              {['Clone', 'Configure', 'Ship'].map((title, i) => (
                <div
                  key={title}
                  className="sticky rounded-2xl bg-surface p-8"
                  style={{ top: `${64 + i * 28}px` }}
                >
                  <p className="kicker rounded-lg bg-background px-3 py-2 text-muted-foreground w-fit">
                    0{i + 1}
                  </p>
                  <p className="mt-4 text-xl font-medium tracking-tight">
                    {title}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Sticky stacking card — pins at an offset while the next one
                    slides over it. Solid surface fill, no shadow.
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              sticky stack — cards pin at staggered offsets
            </p>
          </div>

          {/* 4. Marquee: list duplicated once inside the track; pauses on
              hover. */}
          <div className="space-y-1.5">
            <div className="marquee rounded-2xl bg-surface py-6">
              <div
                className="marquee-track gap-4 pr-4"
                style={{ '--marquee-duration': '24s' } as React.CSSProperties}
              >
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    className="flex shrink-0 gap-4"
                    aria-hidden={copy === 1}
                  >
                    {[
                      'Poster',
                      'Promo reel',
                      'Teaser',
                      'Loop',
                      'Cover',
                      'Banner',
                    ].map((name) => (
                      <div
                        key={name}
                        className="flex h-28 w-44 items-end rounded-xl bg-background p-4"
                      >
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              marquee — infinite scroll, pauses on hover
            </p>
          </div>
        </div>
      </Section>

      <Section title="Motion — loading states">
        <div className="flex flex-wrap items-start gap-6">
          <div className="space-y-1.5">
            <div className="shimmer flex size-64 flex-col items-center justify-center gap-3 rounded-xl bg-secondary">
              <GooLoader />
            </div>
            <p className="text-xs text-muted-foreground">
              card placeholder — shimmer + goo
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="shimmer flex aspect-video w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl bg-secondary">
              <GooLoader />
            </div>
            <p className="text-xs text-muted-foreground">wide placeholder</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-shimmer">Thinking</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-shimmer">Processing job</span>
              <span className="font-mono text-[11px]">0:42</span>
            </span>
            <span className="flex items-center gap-1.5">
              Job finished
              <span className="font-mono text-[11px]">1.2s</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            in-progress label — .text-shimmer sweep (last row = settled state)
          </p>
        </div>
      </Section>
    </div>
  )
}
