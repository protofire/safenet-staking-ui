import { expect, test } from '@playwright/test'

import { E2E_ACCOUNT } from '../env'
import { installMockFeeds } from '../mocks/feeds'
import { DEFAULT_CHAIN_STATE, installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const SEPOLIA_CHAIN_ID = 11155111
const SAFE = 10n ** 18n

const STALE_MERKLE_ROOT = `0x${'cc'.repeat(32)}` as const

const claimBanner = (page: import('@playwright/test').Page) =>
  page.getByRole('status').filter({ hasText: 'available to claim' })

test.describe('portfolio rewards', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, { account: E2E_ACCOUNT, chainId: SEPOLIA_CHAIN_ID })
    await installMockFeeds(page)
  })

  test('shows the claimable amount from the proof and on-chain claimed total', async ({ page }) => {
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

  test('claims rewards with the proof served for the account', async ({ page }) => {
    const chain = await installMockRpc(page, {
      ...DEFAULT_CHAIN_STATE,
      cumulativeClaimed: 400n * SAFE,
    })
    await page.goto('/#/portfolio')

    await claimBanner(page).getByRole('button', { name: 'Claim' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Claim staking rewards' })).toBeVisible()
    await expect(dialog).toContainText('5,000')

    await dialog.getByRole('button', { name: 'Claim rewards' }).click()
    await expect(dialog.getByText('Claimed 5,000 SAFE to your wallet.')).toBeVisible()

    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['claim'])
    expect(chain.state.cumulativeClaimed).toBe(5_400n * SAFE)
    expect(chain.state.tokenBalance).toBe(DEFAULT_CHAIN_STATE.tokenBalance + 5_000n * SAFE)
    await expect(claimBanner(page)).toHaveCount(0)
  })

  test('hides the claim banner when the on-chain root no longer matches the proof', async ({
    page,
  }) => {
    await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, merkleRoot: STALE_MERKLE_ROOT })
    await page.goto('/#/portfolio')

    await expect(
      page.getByText('Merkle root on-chain does not match the rewards file', { exact: false }),
    ).toBeVisible()
    await expect(claimBanner(page)).toHaveCount(0)
  })

  test('opens the claim dialog from the ?claim=1 link', async ({ page }) => {
    await installMockRpc(page, DEFAULT_CHAIN_STATE)
    await page.goto('/#/portfolio?claim=1')

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Claim staking rewards' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Claim rewards' })).toBeEnabled()
  })
})
