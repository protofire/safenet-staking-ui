import { expect, test } from '@playwright/test'

import { E2E_ACCOUNT } from '../env'
import { installMockFeeds } from '../mocks/feeds'
import { installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const MAINNET_CHAIN_ID = 1

test('prompts to switch when the wallet is on another network', async ({ page }) => {
  await installMockWallet(page, { account: E2E_ACCOUNT, chainId: MAINNET_CHAIN_ID })
  await installMockFeeds(page)
  await installMockRpc(page)
  await page.goto('/#/validators')

  const banner = page
    .getByRole('alert')
    .filter({ hasText: 'Your wallet is on a different network than this app.' })
  await expect(banner).toBeVisible()

  await banner.getByRole('button', { name: 'Switch to Sepolia' }).click()
  await expect(banner).toHaveCount(0)
})
