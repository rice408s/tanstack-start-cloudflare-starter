// Product analytics, same registry shape as core/audit and core/notify: any
// server code calls `track(event)`; the analytics feature registers a sink
// that forwards it to PostHog. With no sink registered (feature deleted) it
// is a no-op, so callers never need to know whether analytics exists.
//
// Events are product facts about a user — snake_case past tense
// (`signed_up`, `purchase_completed`) with a handful of flat properties.
// Never secrets, never free text, never request bodies.

export type TrackEvent = {
  event: string
  // The user the event belongs to. Required: server-side events are only
  // ever about signed-in users — anonymous traffic is the browser's job.
  userId: string
  properties?: Record<string, string | number | boolean | null | undefined>
  // Person properties to set alongside (PostHog `$set`).
  set?: Record<string, string | number | boolean | null | undefined>
}

type Sink = (event: TrackEvent) => Promise<void>

const sinks: Sink[] = []

export function onTrack(sink: Sink) {
  sinks.push(sink)
}

// Self-loading registry (see core/audit/events.ts for why).
let handlersLoaded: Promise<unknown> | undefined

// Best-effort by design: analytics must never fail the action it describes.
export async function track(event: TrackEvent): Promise<void> {
  handlersLoaded ??= import('./handlers').catch((err) => {
    console.error('[analytics] failed to load sinks', err)
  })
  await handlersLoaded
  for (const sink of sinks) {
    try {
      await sink(event)
    } catch (err) {
      console.error('[analytics] sink failed', event.event, err)
    }
  }
}
