import { expect, test, type Page } from '@playwright/test'
import { maxUint256 } from 'viem'

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

  test('approves an unlimited allowance then stakes', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 0n })
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('100')
    await dialog.getByRole('button', { name: 'Use unlimited approval instead' }).click()
    await dialog.getByRole('button', { name: 'Approve unlimited' }).click()
    await expect(page.getByText('Approval confirmed')).toBeVisible()
    expect(chain.state.allowance).toBe(maxUint256)

    await dialog.getByRole('button', { name: 'Stake', exact: true }).click()
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toBeVisible()
    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['approve', 'stake'])
  })

  test('keeps the dialog open when the wallet rejects the stake', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 1_000n * SAFE })
    chain.nextTransaction = 'reject'
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('50')
    await dialog.getByRole('button', { name: 'Stake', exact: true }).click()

    await expect(page.getByText('Transaction cancelled')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Stake', exact: true })).toBeEnabled()
    await expect(dialog.getByLabel('Amount')).toHaveValue('50')
    expect(chain.sent).toHaveLength(0)
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake)
  })

  test('reports a failure when the stake reverts on-chain', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 1_000n * SAFE })
    chain.nextTransaction = 'revert'
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('50')
    await dialog.getByRole('button', { name: 'Stake', exact: true }).click()

    await expect(page.getByText('Staking failed')).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Stake', exact: true })).toBeEnabled()
    expect(chain.sent.map((tx) => tx.status)).toEqual(['reverted'])
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake)
  })
})

test.describe('staking with a batching wallet', () => {
  test.beforeEach(async ({ page }) => {
    await installMockWallet(page, {
      account: E2E_ACCOUNT,
      chainId: SEPOLIA_CHAIN_ID,
      batching: true,
    })
    await installMockFeeds(page)
  })

  test('approves and stakes in one batched confirmation', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 0n })
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('100')

    await expect(dialog.getByRole('button', { name: 'Approve SAFE' })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Approve & stake' }).click()
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toBeVisible()
    await expect(dialog.getByText('Staked 100 SAFE to E2E Validator.')).toBeVisible()

    expect(chain.sent.map((tx) => tx.functionName)).toEqual(['approve', 'stake'])
    expect(new Set(chain.sent.map((tx) => tx.hash)).size).toBe(1)
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake + 100n * SAFE)
  })

  test('reports a reverted batch and leaves the stake unchanged', async ({ page }) => {
    const chain = await installMockRpc(page, { ...DEFAULT_CHAIN_STATE, allowance: 0n })
    chain.nextTransaction = 'revert'
    await page.goto('/#/validators')

    const dialog = await openDialog(page, 'Stake', 'Stake SAFE')
    await dialog.getByLabel('Amount').fill('100')
    await dialog.getByRole('button', { name: 'Approve & stake' }).click()

    await expect(page.getByText('Transaction reverted')).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Transaction confirmed' })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Approve & stake' })).toBeEnabled()
    expect(chain.sent.map((tx) => tx.status)).toEqual(['reverted', 'reverted'])
    expect(chain.state.allowance).toBe(0n)
    expect(chain.state.stake).toBe(DEFAULT_CHAIN_STATE.stake)
  })
})
