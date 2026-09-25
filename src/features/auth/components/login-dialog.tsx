import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { m } from '@/paraglide/messages'
import { LoginPanel } from './login-panel'

// Sign-in without leaving the page. Used where the visitor is mid-action and
// a route change would throw the action away — the public share page, where
// they have already typed the message they want to send.
//
// This does not make Google sign-in local: pressing the Google button still
// leaves for accounts.google.com and returns via `callbackURL`. What the
// dialog removes is the interstitial page in between, and it lets One Tap —
// which finishes in place — hand control straight back to `onSignedIn`.
export function LoginDialog({
  open,
  onOpenChange,
  callbackURL,
  onSignedIn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Where Google returns to, for the round-trip path. */
  callbackURL: string
  /** Called when One Tap signed the visitor in without navigating. */
  onSignedIn?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100vw-2rem),26rem)] p-8">
        {/* The panel carries its own heading; this is the accessible name. */}
        <DialogTitle className="sr-only">{m.auth_login_title()}</DialogTitle>
        <LoginPanel callbackURL={callbackURL} onSignedIn={onSignedIn} />
      </DialogContent>
    </Dialog>
  )
}
