import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginPanel } from '@/features/auth/components/login-panel'
import { sessionQuery } from '@/features/auth/queries'
import { safeRedirect } from '@/features/auth/redirect'
import { localizeHref } from '@/paraglide/runtime'

export const Route = createFileRoute('/_auth/login')({
  // Both optional so every plain `to="/login"` link keeps working. `error` is
  // the code a refused OAuth sign-in comes back with (see auth.ts onAPIError).
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; error?: string } => ({
    ...(typeof search.redirect === 'string'
      ? { redirect: search.redirect }
      : {}),
    ...(typeof search.error === 'string' ? { error: search.error } : {}),
  }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session) {
      throw redirect({ href: localizeHref(safeRedirect(search.redirect)) })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: target, error } = Route.useSearch()
  // `redirect` is a delocalized path (the guard strips the prefix), and an
  // unprefixed URL always renders English — so localize the way back, or a
  // /zh visitor signs in and lands in English.
  const callbackURL = localizeHref(safeRedirect(target))
  return <LoginPanel callbackURL={callbackURL} error={error} />
}
