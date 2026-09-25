import { m } from '@/paraglide/messages'

/**
 * The built-in visual styles.
 *
 * A theme here is NOT a colour swap — it is a whole look: palette, corner
 * radius, border weight, surface texture and typeface. Every one of those is
 * a CSS custom property, so a theme is a block of tokens in
 * `src/styles/themes.css` and nothing else. No component branches on the
 * theme, and none ever should: if a new look needs a component to change
 * shape, give the shape a token and let the theme set it.
 *
 * Each theme carries BOTH a light and a dark face. Mode (light/dark/system)
 * stays next-themes' job on the `class` attribute; the theme is written to
 * `data-theme` on <html> by `components/theme-provider.tsx`. The two are
 * orthogonal — four themes x two modes = eight token blocks, and the picker
 * never has to think about the other axis.
 *
 * Strings are THUNKS for the same reason the landing config's are: this
 * module is evaluated once per isolate, while the locale is per request.
 */
export type ThemeId = 'shipkit' | 'editorial' | 'soft' | 'brutal'

export type ThemeDef = {
  id: ThemeId
  /** Name shown in the picker. */
  label: () => string
  /** One line under the name — what the look is for. */
  hint: () => string
  /**
   * Three swatch colours for the picker chip, light face, in paint order:
   * page ground, brand fill, ink. Literals on purpose — the picker has to
   * show a theme that is NOT currently applied, so it cannot read the
   * tokens off the document.
   */
  swatch: [string, string, string]
}

export const themes: ThemeDef[] = [
  {
    id: 'shipkit',
    label: () => m.theme_shipkit_label(),
    hint: () => m.theme_shipkit_hint(),
    swatch: ['oklch(0.99 0 0)', 'oklch(0.54 0.17 255)', 'oklch(0.18 0 0)'],
  },
  {
    id: 'editorial',
    label: () => m.theme_editorial_label(),
    hint: () => m.theme_editorial_hint(),
    swatch: [
      'oklch(0.975 0.009 85)',
      'oklch(0.47 0.15 32)',
      'oklch(0.2 0.012 60)',
    ],
  },
  {
    id: 'soft',
    label: () => m.theme_soft_label(),
    hint: () => m.theme_soft_hint(),
    swatch: [
      'oklch(0.98 0.012 300)',
      'oklch(0.53 0.18 295)',
      'oklch(0.25 0.02 300)',
    ],
  },
  {
    id: 'brutal',
    label: () => m.theme_brutal_label(),
    hint: () => m.theme_brutal_hint(),
    swatch: ['oklch(1 0 0)', 'oklch(0.86 0.17 95)', 'oklch(0.12 0 0)'],
  },
]

export const themeIds = themes.map((t) => t.id)

/**
 * The site's theme for anyone who has never touched the picker — and the
 * whole of the "code-level configuration" story: change this one line and
 * the app ships in that look, picker or no picker.
 */
export const defaultTheme: ThemeId = 'shipkit'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (themeIds as string[]).includes(value)
}

/** localStorage key holding the reader's choice. Also read by the no-flash
 *  script inlined in `__root.tsx`, which cannot import from here. */
export const THEME_STORAGE_KEY = 'shipkit-theme'
