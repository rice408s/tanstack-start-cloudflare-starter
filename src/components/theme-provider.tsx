import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  defaultTheme,
  isThemeId,
  THEME_STORAGE_KEY,
  type ThemeId,
  themeIds,
} from '@/config/themes'

/**
 * The VISUAL STYLE half of theming. The other half — light / dark / system —
 * is next-themes' and stays next-themes'; it owns the `dark` class on <html>
 * and nothing here touches it. This owns `data-theme`, which selects one of
 * the token blocks in `src/styles/themes.css`.
 *
 * Keeping the two on different attributes is what makes them orthogonal: a
 * reader picks a look and a mode independently, and neither picker has to
 * enumerate the other's options.
 *
 * The attribute is written imperatively rather than rendered, because the
 * server cannot know the reader's choice — it lives in localStorage. The
 * inline script below sets it before first paint; this provider only keeps
 * React's copy of the value in step for the picker's checkmark.
 */

type ThemeStyleContext = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const Context = createContext<ThemeStyleContext>({
  theme: defaultTheme,
  setTheme: () => {},
})

/**
 * Runs BEFORE the first paint, inlined in <head>. Without it the document
 * would render under the default look for one frame and then snap to the
 * reader's — the same flash next-themes exists to prevent, and just as ugly.
 *
 * It is built from the registry, so adding a theme needs no edit here. It
 * cannot import anything (it is a string in the document), hence the
 * interpolated list and the literal storage key.
 */
export const themeStyleScript = `!function(){try{var v=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});document.documentElement.dataset.theme=${JSON.stringify(
  themeIds,
)}.indexOf(v)>-1?v:${JSON.stringify(
  defaultTheme,
)}}catch(e){document.documentElement.dataset.theme=${JSON.stringify(
  defaultTheme,
)}}}()`

export function ThemeStyleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme)

  // Catch up with whatever the inline script already applied. Reading it back
  // off the element rather than off storage means the two can never disagree.
  useEffect(() => {
    const applied = document.documentElement.dataset.theme
    if (isThemeId(applied)) setThemeState(applied)
  }, [])

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode / storage disabled: the choice holds for this page only.
    }
  }, [])

  return (
    <Context.Provider value={{ theme, setTheme }}>{children}</Context.Provider>
  )
}

export function useThemeStyle() {
  return useContext(Context)
}
