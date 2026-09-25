import { expect, type Page, test } from '@playwright/test'

// Public pages: prerendered at build, SSR'd in dev. No session needed.
// SSR'd HTML is interactive only after hydration; before clicking anything,
// wait for the module graph to settle (dev serves many small modules).
async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

test('landing page renders in English and Chinese', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'The free SaaS starter',
  )

  await page.goto('/zh')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '免费 SaaS 模板',
  )
})

test('the /zh prefix localizes and sticks across navigation', async ({
  page,
}) => {
  await open(page, '/zh/docs/getting-started')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
  // Paraglide's URL rewrite keeps in-app links inside the locale.
  await page.locator('header').getByRole('link', { name: '博客' }).click()
  await expect(page).toHaveURL(/\/zh\/blog$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh')
})

test('docs and blog are reachable from the header', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('header')
  await header.getByRole('link', { name: 'Docs' }).click()
  await expect(page).toHaveURL(/\/docs/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await header.getByRole('link', { name: 'Blog' }).click()
  await expect(page).toHaveURL(/\/blog$/)
  // At least one post links into /blog/<slug>.
  await expect(page.locator('a[href^="/blog/"]').first()).toBeVisible()
})

test('unknown route shows the branded 404', async ({ page }) => {
  const res = await page.goto('/definitely-not-a-page')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
