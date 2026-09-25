import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/avatar'
import { Panel } from '@/components/page-header'
import { ThemeStyleChoices } from '@/components/theme-picker'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { downloadText } from '@/lib/download'
import { m } from '@/paraglide/messages'
import { getLocale, type Locale, locales, setLocale } from '@/paraglide/runtime'
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '../avatar'
import { authClient } from '../client'
import { sessionQuery } from '../queries'
import {
  exportMyDataFn,
  requestAccountDeletionFn,
  setMyLocaleFn,
} from '../server/fns'

// Account section of the account dialog and /settings: rows grouped under
// three headings, one row per setting, label left, control right. The name saves itself on blur/Enter; deletion asks once,
// in a dialog.

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-6">
      <Label htmlFor={htmlFor} className="shrink-0">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function AccountSection() {
  const { data: session } = useSuspenseQuery(sessionQuery)
  const queryClient = useQueryClient()
  const router = useRouter()
  if (!session) return null
  // Shells read the user from route context (beforeLoad → ensureQueryData,
  // happy with stale cache), so after a profile change force-refetch the
  // session and re-run beforeLoad/loaders.
  const refreshSession = async () => {
    await queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 })
    await router.invalidate()
  }

  // Three groups, by what the rows are about: who you are, how the app
  // behaves for you, and the account as data. Eight rows in one column made
  // "delete my account" read as the next preference after the theme.
  return (
    <div className="flex flex-col gap-8">
      <Panel title={m.settings_profile_title()}>
        <PhotoRow
          name={session.user.name}
          image={session.user.image}
          onChanged={refreshSession}
        />
        <NameRow name={session.user.name} onChanged={refreshSession} />
        <Row label={m.auth_email()}>
          <span className="truncate text-sm text-muted-foreground">
            {session.user.email}
          </span>
        </Row>
      </Panel>
      <Panel title={m.settings_group_preferences()}>
        <ThemeRow />
        <LanguageRow />
      </Panel>
      <Panel title={m.settings_group_account()}>
        <Row label={m.settings_data_title()}>
          <ExportButton />
        </Row>
        <DangerRow />
      </Panel>
    </div>
  )
}

// Profile photo: multipart POST to /api/avatar (R2), DELETE to remove. The
// session query is refetched so the header avatar updates immediately.
function PhotoRow({
  name,
  image,
  onChanged,
}: {
  name: string
  image?: string | null
  onChanged: () => Promise<unknown>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error(m.settings_photo_bad_type())
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(m.settings_photo_too_large())
      return
    }
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/avatar', { method: 'POST', body })
      if (!res.ok) throw new Error(String(res.status))
      await onChanged()
      toast.success(m.settings_saved())
    } catch {
      toast.error(m.auth_error_generic())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Row label={m.settings_photo_label()}>
      <div className="flex items-center gap-2">
        {/* The avatar is the upload control — click to pick a new photo. */}
        <button
          type="button"
          aria-label={m.settings_photo_upload()}
          title={m.settings_photo_upload()}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-full outline-none transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Avatar name={name} image={image} className="size-10 text-sm" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          className="sr-only"
          aria-label={m.settings_photo_upload()}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void upload(file)
          }}
        />
      </div>
    </Row>
  )
}

// Saves on blur or Enter — no separate save button.
function NameRow({
  name,
  onChanged,
}: {
  name: string
  onChanged: () => Promise<unknown>
}) {
  const [draft, setDraft] = useState(name)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const value = draft.trim()
    if (!value || value.length > 100 || value === name) {
      setDraft(name)
      return
    }
    setBusy(true)
    const { error } = await authClient.updateUser({ name: value })
    setBusy(false)
    if (error) {
      toast.error(m.auth_error_generic())
      setDraft(name)
      return
    }
    await onChanged()
    toast.success(m.settings_saved())
  }

  return (
    <Row label={m.settings_name_label()} htmlFor="account-name">
      <Input
        id="account-name"
        value={draft}
        maxLength={100}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className="w-40 sm:w-56"
      />
    </Row>
  )
}

// Visual style. A display preference like the language below it, but held
// only in the browser (localStorage) — it changes nothing the server sends,
// and an account that follows the reader between devices is not obviously
// what anyone wants from a skin. Mode (light/dark) keeps its own control in
// the header; this row is the style axis alone. See src/config/themes.ts.
function ThemeRow() {
  return (
    <Row label={m.theme_style_label()}>
      <ThemeStyleChoices />
    </Row>
  )
}

const localeNames: Record<Locale, string> = { en: 'English', zh: '中文' }

// Language: stored on the user (emails) and applied to the UI via paraglide,
// which reloads the page under the new locale.
function LanguageRow() {
  const current = getLocale()
  const [pending, setPending] = useState(false)
  const change = async (locale: Locale) => {
    if (locale === current) return
    setPending(true)
    try {
      await setMyLocaleFn({ data: { locale } })
    } catch {
      // Preference persists best-effort; the UI still switches.
    }
    setLocale(locale)
  }
  return (
    <Row label={m.settings_language_label()} htmlFor="account-language">
      <Select
        value={current}
        onValueChange={(v) => change(v as Locale)}
        disabled={pending}
      >
        <SelectTrigger id="account-language" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {localeNames[locale]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  )
}

// Download everything we hold about the account as one JSON file.
function ExportButton() {
  const [pending, setPending] = useState(false)
  const download = async () => {
    setPending(true)
    try {
      const data = await exportMyDataFn()
      downloadText(
        `my-data-${data.exportedAt.slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
      )
    } catch {
      toast.error(m.settings_data_error())
    } finally {
      setPending(false)
    }
  }
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={download}>
      {m.settings_data_download()}
    </Button>
  )
}

// Self-service deletion. It CLOSES the account — erased after the retention
// window (see core/account/events.ts). A fresh session is the confirmation
// (no password under OAuth-only sign-in), and features may refuse via
// core/account guards — both surface as codes we translate here. The
// confirm is the shared dialog, not an inline panel: one question, two
// buttons.
function DangerRow() {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    setPending(true)
    let code: string
    try {
      const { purgeAt } = await requestAccountDeletionFn()
      const date = new Intl.DateTimeFormat(getLocale(), {
        dateStyle: 'long',
      }).format(new Date(purgeAt))
      toast.success(m.settings_danger_deleted({ date }))
      window.location.assign('/')
      return
    } catch (error) {
      code = error instanceof Error ? error.message : ''
    } finally {
      setPending(false)
    }
    // A feature can refuse the deletion (core/account guards) with a code;
    // map the ones it defines to a message here.
    switch (code) {
      default:
        toast.error(m.auth_error_generic())
    }
  }

  return (
    <Row label={m.settings_danger_title()}>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        {m.settings_danger_button()}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.settings_danger_title()}
        description={m.settings_danger_body()}
        confirmLabel={m.settings_danger_button()}
        cancelLabel={m.settings_cancel()}
        onConfirm={() => void onDelete()}
      />
    </Row>
  )
}
