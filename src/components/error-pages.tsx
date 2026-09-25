import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

// Router-level fallbacks (see src/router.tsx). Kept deliberately plain:
// they must render even when the app shell, session or data layer failed.

function Frame({
  code,
  title,
  body,
  children,
}: {
  code: string
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="kicker mb-4">{code}</p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <div className="mt-8 flex justify-center gap-3">{children}</div>
      </div>
    </div>
  )
}

/**
 * What a route shows while its loader is still running. Three quiet bars
 * rather than a spinner: the app shell is `ssr: 'data-only'`, so on a hard
 * load this is the first thing painted, and a page-shaped placeholder does
 * not jump when the real one lands. The router only mounts it after
 * `defaultPendingMs`, so a fast navigation never sees it.
 */
export function PendingPage() {
  return (
    <output
      aria-label={m.common_loading()}
      className="flex w-full flex-col gap-4 p-6 motion-safe:animate-pulse sm:p-8"
    >
      <div className="h-6 w-48 rounded-lg bg-secondary" />
      <div className="h-4 w-full max-w-xl rounded-lg bg-secondary" />
      <div className="h-40 w-full rounded-lg bg-secondary" />
    </output>
  )
}

export function NotFoundPage() {
  return (
    <Frame
      code="404"
      title={m.error_not_found_title()}
      body={m.error_not_found_body()}
    >
      <Button asChild>
        <Link to="/">{m.error_go_home()}</Link>
      </Button>
    </Frame>
  )
}

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  // Effects never run during SSR, so a server render logs inline — that
  // console.error is what reaches Workers Logs (observability in
  // wrangler.jsonc). The browser logs once per error, after commit.
  if (import.meta.env.SSR) console.error('[route error]', error)
  useEffect(() => {
    console.error('[route error]', error)
  }, [error])
  // Surface details in dev only; production shows the generic copy and
  // relies on Workers Logs (observability in wrangler.jsonc) for the trace.
  const detail = import.meta.env.DEV ? error.message : undefined
  return (
    <Frame
      code="500"
      title={m.error_generic_title()}
      body={detail ?? m.error_generic_body()}
    >
      <Button
        onClick={() => {
          reset()
          router.invalidate()
        }}
      >
        {m.error_try_again()}
      </Button>
      <Button variant="outline" asChild>
        <Link to="/">{m.error_go_home()}</Link>
      </Button>
    </Frame>
  )
}
