import { TriangleAlertIcon } from 'lucide-react'

// A refused sign-in, said loudly. Shared by the panel (an OAuth callback that
// came back as `/login?error=`) and the code form (a wrong or stale code), so
// the two cannot drift into looking like different kinds of problem.
//
// A solid `--danger` fill rather than red text: the design language keeps
// colour off type and puts it on fills (src/CLAUDE.md, rules 1 and 4). The
// earlier version was muted grey body text under the field, which is exactly
// how you render something nobody notices.
//
// `role="alert"` and not <output>: <output> announces politely, and a rejected
// code is the one thing on this page the visitor must hear about.
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-danger px-4 py-3 text-sm text-danger-foreground"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
