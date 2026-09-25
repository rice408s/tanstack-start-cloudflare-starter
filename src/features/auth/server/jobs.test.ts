// @vitest-environment node
import { eq } from 'drizzle-orm'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { getDb } from '@/core/db'
import { startD1 } from '@/test/d1'
import { ACCOUNT_RETENTION_DAYS } from '../config'
import { user } from '../schema'

// The close-then-purge clock against a real D1: who gets the reminder, when,
// how many times, and who is actually erased. Email is the only thing faked.

const sent = vi.fn()
vi.mock('@/core/email/send', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/core/email/send')>()),
  sendEmailSafely: async (params: unknown) => {
    sent(params)
  },
}))

const { runJobs } = await import('@/core/jobs/events')
await import('./jobs')

const DAY = 86_400_000
const days = ACCOUNT_RETENTION_DAYS

let d1: Awaited<ReturnType<typeof startD1>>
beforeAll(async () => {
  d1 = await startD1()
}, 60_000)
afterAll(() => d1?.dispose())
beforeEach(() => sent.mockReset())

async function seed(id: string, deletedAt: Date | null) {
  await getDb()
    .insert(user)
    .values({ id, name: id, email: `${id}@example.com`, deletedAt })
}

const exists = async (id: string) =>
  (await getDb().select().from(user).where(eq(user.id, id))).length > 0

const remindedTo = () =>
  sent.mock.calls
    .map(([p]) => p as { template: string; to: string })
    .filter((p) => p.template === 'account-purge-reminder')
    .map((p) => p.to)
    .sort()

describe('closed accounts', () => {
  it('reminds once in the last days, and erases only past the window', async () => {
    const now = Date.now()
    await seed('active', null)
    await seed('fresh', new Date(now - DAY))
    // Erased in just under three days: reminded.
    await seed('soon', new Date(now - (days - 3) * DAY - 3_600_000))
    // Erased in just over three days: not yet.
    await seed('later', new Date(now - (days - 3) * DAY + 3_600_000))
    // Past the window: erased, and never reminded on the way out.
    await seed('expired', new Date(now - (days + 1) * DAY))

    await runJobs()

    expect(await exists('expired')).toBe(false)
    for (const id of ['active', 'fresh', 'soon', 'later']) {
      expect(await exists(id)).toBe(true)
    }
    expect(remindedTo()).toEqual(['soon@example.com'])

    // The cron firing again the same night sends nothing more.
    sent.mockReset()
    await runJobs()
    expect(remindedTo()).toEqual([])
  })

  it('catches up on a reminder a missed night skipped', async () => {
    // Two days from erasure and never reminded — the night it should have
    // gone out, the cron did not run.
    await seed('missed', new Date(Date.now() - (days - 2) * DAY))
    await runJobs()
    expect(remindedTo()).toEqual(['missed@example.com'])
  })
})
