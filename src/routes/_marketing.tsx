import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { Logo } from '@/components/logo'
import ThemeToggle from '@/components/ThemeToggle'
import ThemePicker from '@/components/theme-picker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appConfig } from '@/config/app-config'
import { AuthNav } from '@/features/auth/components/auth-nav'
import { OneTap } from '@/features/auth/components/one-tap'
import { useScrolled } from '@/lib/motion'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

const navLink =
  'py-2 text-base text-muted-foreground transition-colors hover:text-foreground'

const footerLink =
  'text-sm text-muted-foreground transition-colors hover:text-foreground'

function MarketingLayout() {
  const scrolled = useScrolled()
  return (
    <div className="flex min-h-screen flex-col">
      {/* Translucent, but only where the blur that makes it legible actually
          exists. The base is a solid fill; the supports- pair swaps in 75%
          opacity and a wide blur when backdrop-filter is available, so a
          browser without it gets a readable bar instead of a see-through
          one. 75 and not 0: this used to be a fill-less blur, which stopped
          working the moment both grounds carried real colour (2026-09-11) —
          blur moves detail around, it does not add opacity.

          FIXED, not sticky. A sticky element is pinned to the scrollport,
          and an overscroll bounce moves the scrollport itself — drag down at
          the top of the page on a trackpad and the whole document, header
          included, slides and springs back. Taking it out of flow pins it to
          the viewport instead, so the page can still rubber-band underneath
          it while the bar holds still. <main> below carries the 4rem back as
          padding, which is the height the header used to occupy in flow.

          The hairline is the fixed-header edge rule 9 sanctions, and it
          appears only once the page has actually scrolled. At the top the bar
          sits on the same ground as the content below it, so a rule there
          draws a line through nothing; the moment content slides underneath,
          the line is separating two things that overlap. Transparent rather
          than absent, so the bar's height never changes. */}
      <header
        className={`fixed inset-x-0 top-0 z-10 border-b bg-background transition-colors duration-200 supports-[backdrop-filter]:bg-background/75 supports-[backdrop-filter]:backdrop-blur-xl ${
          scrolled ? 'border-border' : 'border-transparent'
        }`}
      >
        {/* Three-zone grid: brand left, nav dead-center, CTA right. Below
            sm the nav is display:none and so not a grid item at all — two
            columns there, or the right group would slide into the middle. */}
        <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[1fr_auto] items-center px-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
          <Link
            to="/"
            className="wordmark flex w-fit items-center gap-2 py-2 text-2xl"
          >
            <Logo className="size-7" />
            {appConfig.name}
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <Link to="/docs" className={navLink}>
              {m.nav_docs()}
            </Link>
            <Link to="/blog" className={navLink}>
              {m.nav_blog()}
            </Link>
          </nav>
          <div className="flex items-center justify-end gap-3 sm:gap-5">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <MenuIcon className="size-5" />
                  <span className="sr-only">{m.app_open_menu()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-36">
                <DropdownMenuItem asChild>
                  <Link to="/docs">{m.nav_docs()}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/blog">{m.nav_blog()}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Display preferences first, identity last — the order ShipAny
                and most dev-tool headers use. Three controls now: the style
                (which of the built-in looks), the mode (light/dark) and the
                locale. All icon-width, so they still cost the centred nav
                nothing. */}
            <ThemePicker />
            <ThemeToggle />
            <LocaleSwitcher />
            <AuthNav />
          </div>
        </div>
      </header>
      <OneTap />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <Link to="/" className="wordmark flex items-center gap-2 text-lg">
                <Logo className="size-5" />
                {appConfig.name}
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                {appConfig.description}
              </p>
            </div>
            <div className="flex gap-16 sm:gap-20">
              <div className="flex flex-col items-start gap-3">
                <span className="kicker">{m.footer_product()}</span>
                <Link to="/docs" className={footerLink}>
                  {m.nav_docs()}
                </Link>
              </div>
              <div className="flex flex-col items-start gap-3">
                <span className="kicker">{m.footer_resources()}</span>
                <Link to="/blog" className={footerLink}>
                  {m.nav_blog()}
                </Link>
                <a
                  href={`mailto:${appConfig.supportEmail}`}
                  className={footerLink}
                >
                  {m.footer_contact()}
                </a>
              </div>
              <div className="flex flex-col items-start gap-3">
                <span className="kicker">{m.footer_legal()}</span>
                <Link
                  to="/legal/$slug"
                  params={{ slug: 'terms' }}
                  className={footerLink}
                >
                  {m.nav_terms()}
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: 'privacy' }}
                  className={footerLink}
                >
                  {m.nav_privacy()}
                </Link>
                <Link
                  to="/legal/$slug"
                  params={{ slug: 'dmca' }}
                  className={footerLink}
                >
                  {m.nav_dmca()}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pb-8 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {appConfig.legalEntity.name}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
