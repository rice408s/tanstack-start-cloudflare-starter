// In-app notifications, same self-loading registry as core/email: producers
// call notify() after their business write succeeds and the notifications
// feature registers the sink that persists rows. No sink = no-op, so
// producers never depend on the notifications feature existing. Best-effort
// by design — D1 has no transactions, so a lost notification is acceptable
// while a phantom one (notify before the write) is not.

export type NotifyEvent = {
  userId: string
  // '<feature>.<verb>' — the bell maps it to localized copy at render time;
  // rows with a type no renderer knows are skipped, never crash.
  type: string
  // Values the copy interpolates (amounts, counts). Small scalars only —
  // never secrets or free text from other users.
  params?: Record<string, string | number>
}

type Sink = (event: NotifyEvent) => Promise<void>

const sinks: Sink[] = []

export function onNotify(sink: Sink) {
  sinks.push(sink)
}

let handlersLoaded: Promise<unknown> | undefined

// A notification failure never fails (or re-throws from) the caller.
export async function notify(event: NotifyEvent): Promise<void> {
  handlersLoaded ??= import('./handlers').catch((err) => {
    console.error('[notify] failed to load sinks', err)
  })
  await handlersLoaded
  for (const sink of sinks) {
    try {
      await sink(event)
    } catch (err) {
      console.error('[notify] sink failed', event.type, err)
    }
  }
}
