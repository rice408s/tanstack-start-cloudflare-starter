import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Logo } from '@/components/logo'
import { appConfig } from '@/config/app-config'
import { seo } from '@/lib/seo'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_auth')({
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex' },
      ...seo({ title: m.auth_login_title() }),
    ],
  }),
  component: AuthLayout,
})

function AuthLayout() {
  return (
    // No card and no border: on a page holding one thing, the box around it
    // is a second thing. Whitespace does the framing — see src/CLAUDE.md,
    // rule 9.
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Logo className="size-6" />
          {appConfig.name}
        </Link>
        <div className="mt-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
