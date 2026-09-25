import { Link } from '@tanstack/react-router'
import {
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app-config'
import { m } from '@/paraglide/messages'

// App-shell navigation. `mainNav` is the single source of the sidebar
// entries. `SidebarNav` is shared by the desktop sidebar and the mobile sheet
// (src/routes/_app.tsx). Add a row here when you add a page under _app/.

const mainNav = [
  {
    to: '/dashboard',
    label: () => m.app_dashboard_title(),
    icon: LayoutDashboardIcon,
  },
  { to: '/settings', label: () => m.app_settings_title(), icon: SettingsIcon },
] as const

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  // Labels in ink, icons in grey: a grey column of labels is hard to scan,
  // and the icons are what the eye should skip. The current page is told
  // apart by weight, the rule and a filled icon colour, not by the label
  // lighting up. Styled off `data-status`, not activeProps: the router
  // APPENDS activeProps' classes to className, so the transparent rule would
  // fight the active one.
  const linkClass = `group/nav flex items-center gap-3 border-l-2 border-transparent py-2 text-sm text-foreground transition-colors hover:bg-secondary data-[status=active]:border-primary data-[status=active]:font-semibold ${
    collapsed ? 'justify-center pr-0.5' : 'px-4'
  }`

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-6">
      {mainNav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={linkClass}
          onClick={onNavigate}
          title={collapsed ? item.label() : undefined}
        >
          <item.icon className="size-4 shrink-0 text-muted-foreground group-data-[status=active]/nav:text-foreground" />
          {!collapsed && <span className="truncate">{item.label()}</span>}
        </Link>
      ))}
    </nav>
  )
}

export function Brand() {
  return (
    <Link
      to="/"
      className="wordmark flex items-center gap-2 whitespace-nowrap text-lg"
    >
      <Logo className="size-6" />
      {appConfig.name}
    </Link>
  )
}

// Desktop sidebar: full shell height, collapsible; only the nav scrolls, so
// the brand row and the account footer stay pinned on short screens
// (state persisted in localStorage — the app shell is client-rendered, so
// reading it in the initializer is safe and avoids a flicker). There is no
// app header: the account widgets (the user menu) come in as
// `footer` from src/routes/_app.tsx, which also hands them to the mobile
// sheet.
export function AppSidebar({
  actions,
  footer,
}: {
  /** Icon buttons beside the collapse toggle (the notification bell). */
  actions?: ReactNode
  footer?: (collapsed: boolean) => ReactNode
}) {
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('sidebar-collapsed') === '1',
  )
  const toggle = () =>
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', prev ? '0' : '1')
      return !prev
    })

  return (
    <aside
      className={`hidden h-full shrink-0 flex-col overflow-hidden bg-sidebar transition-[width] duration-200 lg:flex ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div
        className={`flex shrink-0 items-center ${
          collapsed
            ? 'flex-col-reverse gap-1 py-3'
            : 'h-14 justify-between pr-4 pl-6'
        }`}
      >
        {!collapsed && <Brand />}
        <div
          className={`flex items-center gap-1 ${collapsed ? 'flex-col-reverse' : ''}`}
        >
          {actions}
          <Button variant="ghost" size="icon" onClick={toggle}>
            {collapsed ? (
              <PanelLeftOpenIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
            <span className="sr-only">{m.app_toggle_sidebar()}</span>
          </Button>
        </div>
      </div>
      <SidebarNav collapsed={collapsed} />
      {footer?.(collapsed)}
    </aside>
  )
}
