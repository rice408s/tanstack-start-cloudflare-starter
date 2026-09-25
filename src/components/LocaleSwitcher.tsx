import { CheckIcon, ChevronDownIcon, LanguagesIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { m } from '@/paraglide/messages'
import { getLocale, type Locale, locales, setLocale } from '@/paraglide/runtime'

const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
}

export default function LocaleSwitcher({
  onChange,
}: {
  /** Runs before the switch (e.g. persist the preference); the page then reloads in the new locale. */
  onChange?: (locale: Locale) => Promise<unknown>
} = {}) {
  const currentLocale = getLocale()

  return (
    // modal would lock body scroll and yank the scrollbar — a locale menu
    // doesn't need that.
    <DropdownMenu modal={false}>
      {/* The glyph alone: the menu names the languages, so repeating the
          current one in the trigger says nothing the menu won't. The label
          moves to aria-label so it stays announced. */}
      <DropdownMenuTrigger
        aria-label={m.settings_language_label()}
        className="flex items-center gap-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
      >
        <LanguagesIcon className="size-4" aria-hidden="true" />
        <ChevronDownIcon className="size-3" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={async () => {
              await onChange?.(locale)
              setLocale(locale)
            }}
            className="justify-between text-sm"
          >
            {localeNames[locale]}
            {locale === currentLocale && (
              <CheckIcon className="size-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
