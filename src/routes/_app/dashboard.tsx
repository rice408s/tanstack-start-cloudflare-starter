import { createFileRoute, Link, type LinkProps } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader, StatStrip } from '@/components/page-header'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

// Home: a greeting, one figure per area (each a link to that area), and a
// first-run checklist until it is done or dismissed. As you add features,
// give each one a StatCard and, if it has a first step, a SetupGuide row.

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
})

// One figure per area in a shared strip: label, value, and the link that
// acts on it. The whole cell is the link.
function StatCard({
  label,
  value,
  to,
  cta,
}: {
  label: string
  value: string
  to: LinkProps['to']
  cta: string
}) {
  return (
    <Link
      to={to}
      className="group flex min-w-48 flex-1 flex-col px-5 py-4 transition-colors hover:bg-surface"
    >
      <p className="kicker">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium">
        {cta}
        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

type SetupStep = {
  done: boolean
  label: string
  hint: string
  to: LinkProps['to']
}

const SETUP_DISMISSED = 'home-setup-dismissed'

// First-run checklist — what a new account should do next, in the order it
// pays off. Each step's `done` comes from data the page already loaded, so
// the list costs no request of its own. Replace the steps with your
// product's own first run; keep them few and each one checkable.
//
// Rendered only after mount: whether it was dismissed lives in this
// browser's storage, and a server render that showed it would flash it at
// everyone who closed it.
function SetupGuide({ steps }: { steps: SetupStep[] }) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(SETUP_DISMISSED) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const done = steps.filter((s) => s.done).length
  if (dismissed !== false || done === steps.length) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(SETUP_DISMISSED, '1')
    } catch {}
  }

  return (
    <section className="mt-8 rounded-lg border">
      <div className="flex items-start justify-between gap-4 px-5 pt-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{m.home_setup_title()}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {m.home_setup_progress({ done, total: steps.length })}
          </p>
          <div className="mt-3 h-1 max-w-xs overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={m.home_setup_dismiss()}
          title={m.home_setup_dismiss()}
          className="-mr-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <ul className="mt-3 divide-y border-t">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              to={step.to}
              className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface"
            >
              {step.done ? (
                <CircleCheckIcon className="size-4 shrink-0" />
              ) : (
                <CircleIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${step.done ? 'text-muted-foreground line-through' : ''}`}
                >
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-sm text-muted-foreground">{step.hint}</p>
                )}
              </div>
              {!step.done && (
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const firstName = session.user.name.split(' ')[0] || session.user.name
  const since = new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
  }).format(new Date(session.user.createdAt))

  return (
    <div>
      <PageHeader title={m.home_greeting({ name: firstName })} />

      <StatStrip>
        <StatCard
          label={m.home_member_since()}
          value={since}
          to="/settings"
          cta={m.home_account_manage()}
        />
        <StatCard
          label={m.home_next_label()}
          value={m.home_next_value()}
          to="/docs"
          cta={m.home_next_cta()}
        />
      </StatStrip>

      <SetupGuide
        steps={[
          {
            done: Boolean(session.user.image),
            label: m.home_step_profile(),
            hint: m.home_step_profile_hint(),
            to: '/settings',
          },
        ]}
      />
    </div>
  )
}
