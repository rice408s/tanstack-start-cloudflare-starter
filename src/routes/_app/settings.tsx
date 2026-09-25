import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/page-header'
import { AccountSection } from '@/features/auth/components/account-section'
import { m } from '@/paraglide/messages'

// Account settings as a page — profile, language, data export and deletion.
// Same <AccountSection /> the account dialog shows; see ./billing.tsx.

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <PageHeader title={m.app_settings_title()} />
      <AccountSection />
    </>
  )
}
