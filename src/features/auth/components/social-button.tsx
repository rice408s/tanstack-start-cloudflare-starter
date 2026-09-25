import type { ReactNode } from 'react'
import { useState } from 'react'
import { localizeHref } from '@/paraglide/runtime'
import { authClient } from '../client'

// The shared shell behind every sign-in button: same shape, same disabled
// state, one place to change how a provider hand-off looks. Each provider
// file supplies only its mark and its label.
//
// `pending` is never cleared. The click navigates away to the provider, so
// the only way back into this component is a fresh mount — leaving the
// button disabled prevents a second round trip being started on top of the
// first one.
export function SocialButton({
  provider,
  callbackURL = '/dashboard',
  icon,
  label,
  title,
}: {
  provider: 'google' | 'github'
  /** Where to land after the provider returns — carries a share link's remix. */
  callbackURL?: string
  icon: ReactNode
  /** Short beside a sibling ("Google"), a sentence when it stands alone. */
  label: string
  /** Full sentence for the tooltip when `label` is only the brand name. */
  title?: string
}) {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      title={title}
      onClick={() => {
        setPending(true)
        authClient.signIn.social({
          provider,
          callbackURL,
          // A refused sign-in comes back as /login?error=<code>, in the
          // visitor's language, where LoginPanel explains it.
          errorCallbackURL: localizeHref('/login'),
        })
      }}
      className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-btn)] border border-foreground py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  )
}
