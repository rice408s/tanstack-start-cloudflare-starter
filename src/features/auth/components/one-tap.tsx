import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { appConfig } from '@/config/app-config'
import { localizeHref } from '@/paraglide/runtime'
import { authClient } from '../client'
import { sessionQuery } from '../queries'

// Renders nothing; shows Google One Tap once per mount for logged-out
// visitors. Google itself handles dismissal cooldowns, so this stays quiet
// for users who closed it recently.
export function OneTap({
  callbackURL = '/dashboard',
  onSignedIn,
}: {
  callbackURL?: string
  /** One Tap completes without leaving the page. A caller that can carry on
   * right here (the share page has a message waiting) passes this and takes
   * over instead of letting better-auth navigate to `callbackURL`. */
  onSignedIn?: () => void
}) {
  const { data: session, isPending } = useQuery(sessionQuery)
  const queryClient = useQueryClient()
  const fired = useRef(false)

  useEffect(() => {
    // No Google client id in app-config: Google sign-in is not set up.
    if (!appConfig.googleClientId) return
    if (isPending || session || fired.current) return
    fired.current = true
    authClient
      .oneTap({
        // With a handler the caller drives what happens next, so better-auth
        // must not navigate: a redirect here would throw away the in-page
        // completion that is the whole point of One Tap.
        ...(onSignedIn ? {} : { callbackURL }),
        fetchOptions: {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['session'] })
            onSignedIn?.()
          },
          // One Tap has no redirect to carry an error, so a closed account
          // is sent to the login page to be told why it was refused.
          onError: ({ error }) => {
            if (error.code === 'ACCOUNT_DELETED') {
              window.location.assign(
                `${localizeHref('/login')}?error=ACCOUNT_DELETED`,
              )
            }
          },
        },
      })
      .catch(() => {
        // Prompt unavailable (cooldown, unsupported browser) — the regular
        // login button still works.
      })
  }, [isPending, session, queryClient, callbackURL, onSignedIn])

  return null
}
