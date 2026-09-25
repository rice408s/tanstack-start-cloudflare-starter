import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { m } from '@/paraglide/messages'

/**
 * One button, one job: click flips light ↔ dark. No menu — a theme switch is
 * a two-state thing, and a dropdown makes the reader pick twice.
 *
 * The choice is read from `resolvedTheme`, so the first click off "system"
 * goes to the opposite of what the reader is actually looking at rather than
 * to a fixed side.
 *
 * `resolvedTheme` is undefined until next-themes has read localStorage, and
 * the server cannot know it either. Rendering an icon before that point is a
 * hydration mismatch, so the button holds a fixed-size placeholder until
 * mount — the header never reflows, it just fills in.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={m.theme_label()}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center rounded-[var(--radius-btn)] p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="size-4" aria-hidden="true" />
        ) : (
          <MoonIcon className="size-4" aria-hidden="true" />
        )
      ) : (
        <span className="size-4" />
      )}
    </button>
  )
}
