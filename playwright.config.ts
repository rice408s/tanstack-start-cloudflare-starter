import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against the real dev server (workerd + local D1).
// `bun run e2e` — starts `bun run dev` if :3000 is not already serving.
// Global setup applies migrations and forges one signed-in user, so no test
// needs a real sign-in. See e2e/README.md.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 30_000,
  // The dev server compiles each route on its first request, and a CI runner
  // is slow at it: the first visit to a page can take longer than the 5s
  // default, which made the first tests fail before the page existed.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
