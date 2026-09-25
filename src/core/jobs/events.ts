// Scheduled maintenance, same registry shape as core/payment and
// core/account: features register named jobs; the Worker's `scheduled`
// handler (src/server.ts) runs them all on the cron in wrangler.jsonc.
// Jobs must be idempotent — a cron can fire twice or be run by hand.

export type Job = { name: string; run: () => Promise<string> }

const jobs: Job[] = []

export function registerJob(job: Job) {
  jobs.push(job)
}

// Runs every job, isolating failures so one broken job never starves the
// rest. Returns a per-job summary for logs (and the admin API later).
export async function runJobs(): Promise<
  Array<{ name: string; ok: boolean; detail: string }>
> {
  const results = []
  for (const job of jobs) {
    try {
      const detail = await job.run()
      console.log(`[jobs] ${job.name}: ${detail}`)
      results.push({ name: job.name, ok: true, detail })
    } catch (err) {
      console.error(`[jobs] ${job.name} failed`, err)
      results.push({ name: job.name, ok: false, detail: String(err) })
    }
  }
  return results
}
