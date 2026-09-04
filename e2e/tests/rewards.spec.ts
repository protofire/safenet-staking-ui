import { expect, test } from '@playwright/test'

import { E2E_ACCOUNT } from '../env'
import { installMockFeeds } from '../mocks/feeds'
import { DEFAULT_CHAIN_STATE, installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const SEPOLIA_CHAIN_ID = 11155111
const SAFE = 10n ** 18n

const claimBanner = (page: import('@playwright/test').Page) =>
  page.getByRole('status').filter({ hasText: 'available to claim' })

test.describe('portfolio rewards', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, { account: E2E_ACCOUNT, chainId: SEPOLIA_CHAIN_ID })
    await installMockFeeds(page)
  })

  test('shows the claimable amount from the proof and on-chain claimed total', async ({
    page,
  }) => {
    await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, cumulativeClaimed: 400n * SAFE })
    await page.goto('/#/portfolio')

    await expect(page.getByRole('table').getByText('E2E Validator')).toBeVisible()
    const banner = claimBanner(page)
    await expect(banner).toContainText('5,000 SAFE')
    await expect(banner.getByRole('button', { name: 'Claim' })).toBeVisible()
  })

  test('hides the claim banner when the proof amount is fully claimed', async ({ page }) => {
    await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, cumulativeClaimed: 5_400n * SAFE })
    await page.goto('/#/portfolio')

    await expect(page.getByRole('table').getByText('E2E Validator')).toBeVisible()
    await expect(claimBanner(page)).toHaveCount(0)
  })
})
