import { CheckIcon, ChevronDownIcon, PaletteIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useThemeStyle } from '@/components/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ThemeDef, type ThemeId, themes } from '@/config/themes'
import { m } from '@/paraglide/messages'

/**
 * Picks the visual STYLE. `ThemeToggle` next to it picks light/dark — two
 * controls because they are two independent choices (see theme-provider).
 *
 * Both shapes below share one rule: the swatch colours come from the
 * registry as literals, never from the live tokens. A row has to show the
 * theme it would switch TO, and that theme's tokens are not on the document.
 */

function Swatch({ theme }: { theme: ThemeDef }) {
  const [ground, brand, ink] = theme.swatch
  return (
    <span
      aria-hidden="true"
      // A hairline of its own, because the first stop is near-white in three
      // of the four themes and would otherwise vanish into a light menu.
      className="inline-flex size-4 shrink-0 overflow-hidden rounded-full border border-border"
    >
      <span className="h-full w-1/3" style={{ background: ground }} />
      <span className="h-full w-1/3" style={{ background: brand }} />
      <span className="h-full w-1/3" style={{ background: ink }} />
    </span>
  )
}

/**
 * Header shape: a glyph that opens the list. Like the locale switcher it
 * does not name the current choice in the trigger — the menu does.
 *
 * `mounted` guards the checkmark: the applied theme is only known after the
 * provider has read it back from the document, and rendering a different
 * row as checked on the server than on the client is a hydration mismatch.
 */
export default function ThemePicker() {
  const { theme, setTheme } = useThemeStyle()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={m.theme_style_label()}
        className="flex items-center gap-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
      >
        <PaletteIcon className="size-4" aria-hidden="true" />
        <ChevronDownIcon className="size-3" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => setTheme(t.id)}
            className="gap-3"
          >
            <Swatch theme={t} />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm">{t.label()}</span>
              <span className="text-xs text-muted-foreground">{t.hint()}</span>
            </span>
            {mounted && t.id === theme && (
              <CheckIcon className="ml-auto size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Settings shape: the four looks side by side as swatch buttons, so the
 * choice is made by looking rather than by reading. Narrow enough to sit in
 * the same right-hand column as the language select.
 */
export function ThemeStyleChoices() {
  const { theme, setTheme } = useThemeStyle()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <fieldset className="flex gap-1.5">
      <legend className="sr-only">{m.theme_style_label()}</legend>
      {themes.map((t) => (
        <ThemeChoice
          key={t.id}
          theme={t}
          selected={mounted && t.id === theme}
          onSelect={setTheme}
        />
      ))}
    </fieldset>
  )
}

function ThemeChoice({
  theme,
  selected,
  onSelect,
}: {
  theme: ThemeDef
  selected: boolean
  onSelect: (id: ThemeId) => void
}) {
  return (
    <button
      type="button"
      // A pressed toggle rather than a radio: the group is a row of
      // equivalent buttons, and a real radiogroup would owe the reader arrow
      // -key roving focus that four swatches do not earn.
      aria-pressed={selected}
      title={`${theme.label()} — ${theme.hint()}`}
      onClick={() => onSelect(theme.id)}
      className={
        // The selected state is the brand fill's job (design rule 3), worn
        // here as a ring rather than as a background so the swatch stays
        // readable.
        selected
          ? 'flex items-center gap-2 rounded-[var(--radius-btn)] border border-brand bg-secondary px-2 py-1 text-xs'
          : 'flex items-center gap-2 rounded-[var(--radius-btn)] border border-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground'
      }
    >
      <Swatch theme={theme} />
      <span className="hidden sm:inline">{theme.label()}</span>
    </button>
  )
}
