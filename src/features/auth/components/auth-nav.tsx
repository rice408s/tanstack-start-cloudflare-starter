import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'
import { sessionQuery } from '../queries'

const buttonClass =
  'rounded-[var(--radius-btn)] bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85'

// Single "get started" CTA for the (prerendered) marketing header: into the
// app when signed in, to login otherwise. The static HTML ships logged-out;
// the client swaps the target after the session query resolves.
export function AuthNav() {
  const { data: session } = useQuery(sessionQuery)

  return (
    <Link to={session ? '/dashboard' : '/login'} className={buttonClass}>
      {m.marketing_cta()}
    </Link>
  )
}
