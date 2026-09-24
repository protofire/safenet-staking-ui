import { expect, test } from '@playwright/test'

import { E2E_ACCOUNT } from '../env'
import { installMockFeeds } from '../mocks/feeds'
import { BLOCK_TIMESTAMP, DEFAULT_CHAIN_STATE, installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const SEPOLIA_CHAIN_ID = 11155111
const SAFE = 10n ** 18n
const DAY = 24n * 60n * 60n

test.describe('withdrawals', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, { account: E2E_ACCOUNT, chainId: SEPOLIA_CHAIN_ID })
    await installMockFeeds(page)
  })

  test('shows a countdown for a withdrawal still cooling down', async ({ page }) => {
    await installMockRpc(page, {
      ...DEFAULT_CHAIN_STATE,
      pendingWithdrawals: [{ amount: 200n * SAFE, claimableAt: BLOCK_TIMESTAMP + 2n * DAY }],
    })
    await page.goto('/#/withdrawals')

    await expect(page.getByText('2d 0h 0m').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('Cooling down').filter({ visible: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'No matured withdrawals' })).toBeDisabled()
  })

  test('claims the matured withdrawal at the head of the queue', async ({ page }) => {
    const chain = await installMockRpc(page, {
      ...DEFAULT_CHAIN_STATE,
      pendingWithdrawals: [
        { amount: 300n * SAFE, claimableAt: BLOCK_TIMESTAMP - 60n },
        { amount: 200n * SAFE, claimableAt: BLOCK_TIMESTAMP + 2n * DAY },
      ],
    })
    await page.goto('/#/withdrawals')

    await expect(page.getByText('Ready to claim').filter({ visible: true }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Claim withdrawal' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Claim withdrawal' })).toBeVisible()
    await expect(dialog).toContainText('300')
    await dialog.getByRole('button', { name: 'Claim withdrawal' }).click()

    await expect(dialog.getByText('Claimed 300 SAFE to your wallet.')).toBeVisible()
    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['claimWithdrawal'])
    expect(chain.state.pendingWithdrawals).toHaveLength(1)
    expect(chain.state.tokenBalance).toBe(DEFAULT_CHAIN_STATE.tokenBalance + 300n * SAFE)
  })
})

test.describe('withdrawals with a batching wallet', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, {
      account: E2E_ACCOUNT,
      chainId: SEPOLIA_CHAIN_ID,
      batching: true,
    })
    await installMockFeeds(page)
  })

  test('claims every matured withdrawal in one batch', async ({ page }) => {
    const chain = await installMockRpc(page, {
      ...DEFAULT_CHAIN_STATE,
      pendingWithdrawals: [
        { amount: 300n * SAFE, claimableAt: BLOCK_TIMESTAMP - 120n },
        { amount: 200n * SAFE, claimableAt: BLOCK_TIMESTAMP - 60n },
        { amount: 100n * SAFE, claimableAt: BLOCK_TIMESTAMP + 2n * DAY },
      ],
    })
    await page.goto('/#/withdrawals')

    await page.getByRole('button', { name: 'Claim 2 withdrawals' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Claim 2 withdrawals' })).toBeVisible()
    await expect(dialog).toContainText('500')
    await dialog.getByRole('button', { name: 'Claim 2 withdrawals' }).click()

    await expect(dialog.getByText('Claimed 2 withdrawals (500 SAFE).')).toBeVisible()
    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['claimWithdrawal', 'claimWithdrawal'])
    expect(chain.state.pendingWithdrawals).toEqual([
      { amount: 100n * SAFE, claimableAt: BLOCK_TIMESTAMP + 2n * DAY },
    ])
    expect(chain.state.tokenBalance).toBe(DEFAULT_CHAIN_STATE.tokenBalance + 500n * SAFE)
  })
})
