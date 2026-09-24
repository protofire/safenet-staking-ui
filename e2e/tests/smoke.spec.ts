import { expect, test } from '@playwright/test'

test('hash routes and lazy pages', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1, name: /Stake SAFE/i })).toBeVisible()
  await page.goto('/#/definitely-not-a-route')
  await expect(page.getByRole('heading', { level: 1, name: /^4\s*0\s*4$/ })).toBeVisible()
})
