import { UserIcon } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { AccountSection } from '@/features/auth/components/account-section'
import { m } from '@/paraglide/messages'

// The account dialog: the consumer "backstage" (profile, preferences,
// your data) as one modal over the agent surface — there is no standalone
// settings page. A tinted rail on the left, the active section on the
// right. Opened via useAccountDialog() from the avatar menu; the provider
// mounts once per shell. A feature with per-user settings adds a section
// to `sections`.

const sections = [
  {
    id: 'account',
    label: () => m.settings_profile_title(),
    icon: UserIcon,
    render: () => <AccountSection />,
  },
] as const

export type AccountSectionId = (typeof sections)[number]['id']

const AccountDialogContext = createContext<
  ((section?: AccountSectionId) => void) | null
>(null)

/** Opens the account dialog, optionally at a specific section. Null when no
 * provider is mounted (marketing pages). */
export function useAccountDialog() {
  return useContext(AccountDialogContext)
}

export function AccountDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<AccountSectionId>('account')
  const openDialog = useCallback((target?: AccountSectionId) => {
    if (target) setSection(target)
    setOpen(true)
  }, [])
  const active = sections.find((entry) => entry.id === section) ?? sections[0]

  return (
    <AccountDialogContext.Provider value={openDialog}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Fixed footprint: the dialog keeps the same size whichever section
            is open — content scrolls inside the right pane. */}
        {/* The side-by-side layout turns on at lg. Below lg the
            rail flattens into a horizontally scrollable tab strip on top,
            which leaves no corner for the close button: it is hidden there
            and the dialog closes by tapping outside.

            `max-h` is overridden because the base DialogContent caps every
            dialog at 44rem — without this the height below is clamped away. */}
        <DialogContent
          className="h-[min(calc(100dvh-2rem),54rem)] max-h-[calc(100dvh-2rem)] w-[min(calc(100vw-1.5rem),74rem)] flex-col lg:flex-row"
          closeClassName="max-lg:hidden"
        >
          <div className="flex shrink-0 select-none items-center gap-1 overflow-x-auto bg-secondary p-2 lg:w-52 lg:flex-col lg:items-stretch lg:overflow-visible lg:p-3">
            <DialogTitle className="px-3 py-2 text-sm max-lg:sr-only">
              {m.app_settings_title()}
            </DialogTitle>
            {sections.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSection(entry.id)}
                className={`flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm outline-none transition-colors ${
                  active.id === entry.id
                    ? 'bg-background font-medium'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                <entry.icon className="size-4 shrink-0" />
                {entry.label()}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5 lg:p-8">
            {active.render()}
          </div>
        </DialogContent>
      </Dialog>
    </AccountDialogContext.Provider>
  )
}
