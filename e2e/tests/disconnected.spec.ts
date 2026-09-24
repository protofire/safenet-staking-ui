import { expect, test } from '@playwright/test'

import { installMockFeeds } from '../mocks/feeds'
import { installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const SEPOLIA_CHAIN_ID = 11155111

const PAGES = [
  { route: '/#/portfolio', prompt: 'to see your stake and withdrawals.' },
  { route: '/#/withdrawals', prompt: 'to view and claim withdrawals for your address.' },
]

test.describe('without a connected wallet', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, { account: null, chainId: SEPOLIA_CHAIN_ID })
    await installMockFeeds(page)
    await installMockRpc(page)
  })

  for (const { route, prompt } of PAGES) {
    test(`asks to connect on ${route}`, async ({ page }) => {
      await page.goto(route)

      await expect(page.getByText(prompt)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Connect a wallet' })).toBeVisible()
      await expect(page.getByRole('status').filter({ hasText: 'available to claim' })).toHaveCount(
        0,
      )
    })
  }
})
