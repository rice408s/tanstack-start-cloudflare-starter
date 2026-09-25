import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'
import { authProvidersQuery } from '../queries'
import { AuthError } from './auth-error'
import { EmailOtpForm } from './email-otp-form'
import { GithubButton } from './github-button'
import { GoogleButton } from './google-button'
import { OneTap } from './one-tap'

// The sign-in offer itself — heading, provider buttons, consent. Shared by
// the /login page and the dialog the share page opens, so the two can't drift
// apart.
//
// Three doors: a code mailed to the address, Google, and GitHub. Kept to four
// rows on purpose — a sign-in panel is a hallway, and every extra line in it
// is a line somebody reads instead of typing their address. The subtitle is
// gone (the heading already says "Log in") and the two providers share a row.
//
// GitHub appears only where it is configured, and its absence is rendered as
// nothing rather than as a disabled button: an option that cannot work is not
// worth the row. Google needs no such check — it is required to boot. The
// email form is always offered; without a mail provider the code is printed
// to the server log instead (see features/auth/server/auth.ts).
//
// `onSignedIn` is the in-page completion: One Tap finishes without leaving
// the page, so a caller that can carry on right there (the share page, which
// has a message waiting to send) says what to do next. The Google button
// still leaves for accounts.google.com and comes back via `callbackURL` —
// there is no way around that round trip.
export function LoginPanel({
  callbackURL,
  onSignedIn,
  error,
}: {
  callbackURL: string
  onSignedIn?: () => void
  /** Code a refused sign-in came back with (`/login?error=`). */
  error?: string
}) {
  const providers = useQuery(authProvidersQuery).data
  const google = Boolean(providers?.google)
  const github = Boolean(providers?.github)
  return (
    <>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        {m.auth_login_title()}
      </h1>
      {error ? (
        <div className="mb-6">
          <AuthError>
            {error === 'ACCOUNT_DELETED'
              ? m.auth_error_account_deleted()
              : m.auth_error_generic()}
          </AuthError>
        </div>
      ) : null}
      <EmailOtpForm callbackURL={callbackURL} onSignedIn={onSignedIn} />
      {google || github ? (
        <>
          <p className="my-5 text-center text-xs text-muted-foreground">
            {m.auth_or()}
          </p>
          {/* Side by side once there are two: two brand names fit a
              half-width button, and it keeps the whole panel to four rows.
              Alone, a provider takes the full width and says the whole
              sentence. */}
          <div className={google && github ? 'grid grid-cols-2 gap-3' : ''}>
            {google ? (
              <GoogleButton callbackURL={callbackURL} compact={github} />
            ) : null}
            {github ? (
              <GithubButton callbackURL={callbackURL} compact={google} />
            ) : null}
          </div>
        </>
      ) : null}
      {google ? (
        <OneTap callbackURL={callbackURL} onSignedIn={onSignedIn} />
      ) : null}
      <p className="mt-8 text-xs text-muted-foreground">
        <ConsentLine />
      </p>
    </>
  )
}

// "By continuing you agree to our {terms} and {privacy}." with real links —
// the message carries the sentence, the links stay in code.
function ConsentLine() {
  const link = 'underline underline-offset-4 hover:text-foreground'
  const [before, rest] = m
    .auth_login_consent({
      terms: '\u0000',
      privacy: '\u0001',
    })
    .split('\u0000')
  const [between, after] = (rest ?? '').split('\u0001')
  return (
    <>
      {before}
      <Link to="/legal/$slug" params={{ slug: 'terms' }} className={link}>
        {m.nav_terms()}
      </Link>
      {between}
      <Link to="/legal/$slug" params={{ slug: 'privacy' }} className={link}>
        {m.nav_privacy()}
      </Link>
      {after}
    </>
  )
}
