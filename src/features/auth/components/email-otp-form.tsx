import { useQueryClient } from '@tanstack/react-query'
import { ArrowRightIcon, Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { m } from '@/paraglide/messages'
import { authClient } from '../client'
import { AuthError } from './auth-error'

// Sign in with a code mailed to the address — the passwordless third door
// beside Google and GitHub (features/auth/server/auth.ts wires the plugin).
//
// Two steps in one component rather than two routes: the address is already
// in state, the mail is already in the visitor's other tab, and a page
// navigation between "send" and "type it back" is exactly where people lose
// the thread. Going back is `sentTo = null`, not history.
//
// Every failure the user can act on gets its own sentence — a wrong code, an
// expired one, and a burnt one are three different next moves.
const RESEND_COOLDOWN_SECONDS = 60

export function EmailOtpForm({
  callbackURL = '/dashboard',
  onSignedIn,
}: {
  callbackURL?: string
  /** Set by callers that finish in place (the login dialog), like OneTap. */
  onSignedIn?: () => void
}) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  /** Non-null once a code is out: also the "which step am I on" flag. */
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function send(address: string) {
    setPending(true)
    setError(null)
    const { error: failure } = await authClient.emailOtp.sendVerificationOtp({
      email: address,
      type: 'sign-in',
    })
    setPending(false)
    if (failure) {
      setError(m.auth_error_send_failed())
      return
    }
    setSentTo(address)
    setCode('')
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  async function verify() {
    if (!sentTo) return
    setPending(true)
    setError(null)
    const { error: failure } = await authClient.signIn.emailOtp({
      email: sentTo,
      otp: code,
    })
    if (failure) {
      setPending(false)
      setError(describe(failure.code))
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    if (onSignedIn) {
      setPending(false)
      onSignedIn()
      return
    }
    // A full load rather than a client navigation: the session belongs to the
    // server render, same as the return trip from an OAuth provider.
    window.location.assign(callbackURL)
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (pending) return
        if (sentTo) verify()
        else send(email.trim())
      }}
    >
      {sentTo ? (
        <>
          <p className="text-sm text-muted-foreground">
            {m.auth_code_sent({ email: sentTo })}
          </p>
          <Field
            pending={pending}
            disabled={code.length < 6}
            label={pending ? m.auth_signing_in() : m.auth_verify_code()}
          >
            <Input
              // The step exists to be typed into, and the code is already in
              // the visitor's other tab.
              autoFocus
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                // The complaint is about the code that WAS there; the moment
                // it changes, the complaint is stale.
                setError(null)
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={m.auth_code_label()}
              aria-invalid={error !== null}
              placeholder="······"
              className="h-12 rounded-[var(--radius-btn)] pr-14 pl-5 text-lg tracking-[0.4em]"
            />
          </Field>
          <div className="flex justify-between text-xs text-muted-foreground">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => {
                setSentTo(null)
                setError(null)
              }}
            >
              {m.auth_use_another_email()}
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || pending}
              className="hover:text-foreground disabled:hover:text-muted-foreground"
              onClick={() => send(sentTo)}
            >
              {cooldown > 0
                ? m.auth_resend_in({ seconds: cooldown })
                : m.auth_resend_code()}
            </button>
          </div>
        </>
      ) : (
        <Field
          pending={pending}
          disabled={!email.trim()}
          label={pending ? m.auth_sending_code() : m.auth_continue_email()}
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            aria-label={m.auth_email()}
            placeholder={m.auth_email_placeholder()}
            className="h-12 rounded-[var(--radius-btn)] pr-14 pl-5"
          />
        </Field>
      )}
      {error ? <AuthError>{error}</AuthError> : null}
    </form>
  )
}

// The submit sits INSIDE the field rather than under it. Both steps are one
// short value and one action, and giving each its own full-width button added
// two rows to a panel whose whole job is to get out of the way. The label
// still exists — as the button's accessible name and its tooltip — so nothing
// is lost but the line.
function Field({
  pending,
  disabled,
  label,
  children,
}: {
  pending: boolean
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <button
        type="submit"
        disabled={pending || disabled}
        title={label}
        aria-label={label}
        className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        {pending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <ArrowRightIcon className="size-4" />
        )}
      </button>
    </div>
  )
}

function describe(code: string | undefined) {
  switch (code) {
    case 'OTP_EXPIRED':
      return m.auth_error_otp_expired()
    case 'INVALID_OTP':
      return m.auth_error_invalid_otp()
    case 'TOO_MANY_ATTEMPTS':
      return m.auth_error_too_many_attempts()
    // Thrown by the session hook in auth.ts: the code was right, the account
    // is closed.
    case 'ACCOUNT_DELETED':
      return m.auth_error_account_deleted()
    default:
      return m.auth_error_generic()
  }
}
