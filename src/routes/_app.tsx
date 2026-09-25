import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AccountDialogProvider } from '@/components/account-dialog'
import { AppSidebar, Brand, SidebarNav } from '@/components/app-sidebar'
import { PendingPage } from '@/components/error-pages'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { UserMenu } from '@/features/auth/components/user-menu'
import { sessionQuery } from '@/features/auth/queries'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_app')({
  // No SEO needs behind login; skip HTML rendering on the server.
  ssr: 'data-only',
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    // Carry where they were headed, so signing in lands on the page they
    // asked for rather than dumping everyone on the home page.
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { session }
  },
  // The shell is `data-only`, so on a hard load nothing is painted until the
  // guard above resolves. Scoped to this route rather than the router
  // default: the marketing pages are server-rendered and prerendered, and a
  // placeholder has no business in their HTML.
  pendingComponent: PendingPage,
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  const [navOpen, setNavOpen] = useState(false)
  const router = useRouter()

  // <main> is the scroll container, not the window. The router restores its
  // position on back/forward (data-scroll-restoration-id) but carries the
  // position over on forward navigations; its scrollToTopSelectors option
  // would fix that yet also clobbers restored positions. So: remember the
  // last history action and reset to top after render for PUSH/REPLACE only.
  useEffect(() => {
    let lastAction = 'PUSH'
    const unsubHistory = router.history.subscribe(({ action }) => {
      lastAction = action.type
    })
    const unsubRender = router.subscribe('onRendered', () => {
      if (lastAction === 'PUSH' || lastAction === 'REPLACE') {
        document.getElementById('app-main')?.scrollTo({ top: 0, left: 0 })
      }
    })
    return () => {
      unsubHistory()
      unsubRender()
    }
  }, [router])

  return (
    // App shell: fixed to the viewport; only <main> scrolls, so the sidebar
    // stays put. No header on desktop — the account widgets live at the
    // bottom of the sidebar; phones get a slim bar that opens the drawer.
    <AccountDialogProvider>
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar
          footer={(collapsed) => (
            <ShellFooter user={session.user} collapsed={collapsed} />
          )}
        />
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left">
            <div className="flex h-14 items-center px-6">
              <SheetTitle asChild>
                <Brand />
              </SheetTitle>
            </div>
            <SidebarNav onNavigate={() => setNavOpen(false)} />
            <ShellFooter user={session.user} collapsed={false} />
          </SheetContent>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 lg:hidden">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="size-5" />
                  <span className="sr-only">{m.app_open_menu()}</span>
                </Button>
              </SheetTrigger>
              <Brand />
            </div>
            <main
              id="app-main"
              data-scroll-restoration-id="app-main"
              className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <Outlet />
            </main>
          </div>
        </Sheet>
      </div>
    </AccountDialogProvider>
  )
}

// Bottom of the sidebar (and the mobile drawer): the user menu.
function ShellFooter({
  user,
  collapsed,
}: {
  user: Parameters<typeof UserMenu>[0]['user']
  collapsed: boolean
}) {
  return (
    <div
      className={`flex shrink-0 flex-col gap-1 border-t py-3 ${
        collapsed ? 'items-center px-2' : 'px-3'
      }`}
    >
      <UserMenu user={user} collapsed={collapsed} />
    </div>
  )
}
