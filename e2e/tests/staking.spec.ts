import { expect, test, type Page } from '@playwright/test'

import { E2E_ACCOUNT } from '../env'
import { installMockFeeds } from '../mocks/feeds'
import { DEFAULT_CHAIN_STATE, installMockRpc } from '../mocks/rpc'
import { installMockWallet } from '../mocks/wallet'

const SEPOLIA_CHAIN_ID = 11155111
const SAFE = 10n ** 18n

async function openDialog(page: Page, action: 'Stake' | 'Unstake', title: string) {
  await validatorRow(page).getByRole('button', { name: action, exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: title })).toBeVisible()
  return dialog
}

function validatorRow(page: Page) {
  return page.getByRole('table').getByRole('row').filter({ hasText: 'E2E Validator' })
}

test.describe('staking', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, { account: E2E_ACCOUNT, chainId: SEPOLIA_CHAIN_ID })
    await installMockFeeds(page)
  })

  test('approves then stakes when the allowance is too low', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 0n })
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('100')

    await expect(dialog.getByRole('button', { name: 'Stake', exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Approve SAFE' }).click()
    await expect(page.getByText('Approval confirmed')).toBeVisible()

    await dialog.getByRole('button', { name: 'Stake', exact: true }).click()
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toBeVisible()
    await expect(dialog.getByText('Staked 100 SAFE to E2E Validator.')).toBeVisible()

    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['approve', 'stake'])
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake + 100n * SAFE)
  })

  test('stakes directly when the allowance already covers the amount', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 1_000n * SAFE })
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('50')

    await expect(dialog.getByRole('button', { name: 'Approve SAFE' })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Stake', exact: true }).click()
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toBeVisible()

    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['stake'])
  })

  test('starts the unstake cooldown for part of the stake', async ({ page }) => {
    const chain = await installMockRpc(page, DEFAULT_CHAIN_STATE)
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Unstake', 'Unstake from E2E Validator')
    await dialog.getByLabel('Amount').fill('250')
    await dialog.getByRole('button', { name: 'Start cooldown' }).click()

    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toBeVisible()
    await expect(
      dialog.getByText('250 SAFE is queued to unstake from E2E Validator.'),
    ).toBeVisible()

    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['initiateWithdrawal'])
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake - 250n * SAFE)
    expect(chain.state.pendingWithdrawals).toHaveLength(1)
  })
})
