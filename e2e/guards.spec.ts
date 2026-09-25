import { expect, test } from '@playwright/test'
import { USER_STATE } from './helpers'

// Route guards. These are the checks that must never regress.

test('anonymous visitor is sent to /login for app pages', async ({ page }) => {
  await page.goto('/dashboard')
  // The guard hands the target to /login so sign-in lands back on it.
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/)
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

test.describe('signed-in user', () => {
  test.use({ storageState: USER_STATE })

  test('reaches the dashboard and settings', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings$/)
  })
})
