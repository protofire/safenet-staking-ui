import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UndelegateDialog } from './UndelegateDialog'
import { chain } from '@/config/chains'
import type { TxSimulation } from '@/hooks/useTxSimulation'
import { buildValidator, SAFE, TEST_ACCOUNT, TEST_VALIDATOR } from '@/test/fixtures'
import { stubConnectedAccount } from '@/test/wagmiStubs'

const {
  toast,
  useAccount,
  useSwitchChain,
  useWalletReady,
  useValidators,
  useUserPendingWithdrawals,
  useInitiateWithdrawal,
  useInitiateWithdrawalSimulation,
  useWithdrawDelay,
  useUserStakeOnValidator,
} = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useAccount: vi.fn(),
  useSwitchChain: vi.fn(),
  useWalletReady: vi.fn(),
  useValidators: vi.fn(),
  useUserPendingWithdrawals: vi.fn(),
  useInitiateWithdrawal: vi.fn(),
  useInitiateWithdrawalSimulation: vi.fn(),
  useWithdrawDelay: vi.fn(),
  useUserStakeOnValidator: vi.fn(),
}))

vi.mock('sonner', () => ({ toast }))
vi.mock('wagmi', () => ({ useAccount, useSwitchChain }))
vi.mock('@/hooks/useWalletReady', () => ({ useWalletReady }))
vi.mock('@/hooks/useValidators', () => ({ useValidators }))
vi.mock('@/hooks/useWithdrawals', () => ({ useUserPendingWithdrawals }))
vi.mock('@/hooks/useStakingWrites', () => ({
  useInitiateWithdrawal,
  useInitiateWithdrawalSimulation,
}))
vi.mock('@/hooks/useStakingReads', () => ({ useWithdrawDelay, useUserStakeOnValidator }))

const TX_HASH = `0x${'ab'.repeat(32)}` as const

const initiateWithdrawal = vi.fn()
const reset = vi.fn()
const onOpenChange = vi.fn()

function mockWallet(overrides: Record<string, unknown> = {}) {
  useWalletReady.mockReturnValue({
    walletReady: true,
    wrongNetwork: false,
    address: TEST_ACCOUNT,
    expectedChain: chain,
    ...overrides,
  })
}

function mockWithdrawal(overrides: Record<string, unknown> = {}) {
  useInitiateWithdrawal.mockReturnValue({
    initiateWithdrawal,
    isSigningTx: false,
    isConfirmingTx: false,
    isSuccess: false,
    isSafeQueued: false,
    error: null,
    reset,
    txHash: undefined,
    ...overrides,
  })
}

function mockSimulation(simulation: TxSimulation) {
  useInitiateWithdrawalSimulation.mockReturnValue(simulation)
}

function renderDialog() {
  const ui = () => <UndelegateDialog validator={TEST_VALIDATOR} open onOpenChange={onOpenChange} />
  const view = render(ui())
  return { ...view, rerender: () => view.rerender(ui()) }
}

function amountInput() {
  return screen.getByLabelText('Amount')
}

function typeAmount(value: string) {
  fireEvent.change(amountInput(), { target: { value } })
}

function startButton() {
  return screen.getByRole('button', { name: 'Start cooldown' })
}

describe('UndelegateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue(stubConnectedAccount())
    useSwitchChain.mockReturnValue({ switchChain: vi.fn(), isPending: false })
    mockWallet()
    useValidators.mockReturnValue({ data: [buildValidator()] })
    useUserPendingWithdrawals.mockReturnValue({ data: [] })
    useWithdrawDelay.mockReturnValue({ data: 7n * 86_400n })
    useUserStakeOnValidator.mockReturnValue({ data: 250n * SAFE })
    mockWithdrawal()
    mockSimulation({ status: 'ok' })
  })

  describe('form', () => {
    it('shows the validator, stake and cooldown terms', () => {
      renderDialog()

      expect(
        screen.getByRole('dialog', { name: 'Unstake from Test Validator' }),
      ).toBeInTheDocument()
      expect(amountInput()).toHaveAccessibleDescription('Your stake: 250 SAFE')
      expect(screen.getByText('7d')).toBeInTheDocument()
      expect(screen.getByText('Paused')).toBeInTheDocument()
    })

    it('falls back to the short address for validators outside the registry', () => {
      useValidators.mockReturnValue({ data: [] })

      renderDialog()

      expect(
        screen.getByRole('dialog', { name: 'Unstake from 0x1111...111111' }),
      ).toBeInTheDocument()
    })

    it('places the withdrawal after the non-empty pending ones in the queue', () => {
      useUserPendingWithdrawals.mockReturnValue({
        data: [
          { amount: SAFE, claimableAt: 1n },
          { amount: 0n, claimableAt: 2n },
          { amount: 2n * SAFE, claimableAt: 3n },
        ],
      })

      renderDialog()

      expect(screen.getByText('#3')).toBeInTheDocument()
    })

    it('disables the form without a stake on this validator', () => {
      useUserStakeOnValidator.mockReturnValue({ data: 0n })

      renderDialog()

      expect(
        screen.getByText('You have no SAFE delegated with this validator.'),
      ).toBeInTheDocument()
      expect(amountInput()).toBeDisabled()
      expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled()
      expect(startButton()).toBeDisabled()
    })

    it('disables submit for an empty or zero amount', () => {
      renderDialog()
      expect(startButton()).toBeDisabled()

      typeAmount('0')
      expect(startButton()).toBeDisabled()
    })

    it('flags an amount above the stake', () => {
      renderDialog()

      typeAmount('250.000001')

      expect(amountInput()).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText('Exceeds your stake.')).toBeInTheDocument()
      expect(startButton()).toBeDisabled()
    })

    it('unstakes the entered amount from the validator', () => {
      renderDialog()

      typeAmount('100')
      fireEvent.click(startButton())

      expect(initiateWithdrawal).toHaveBeenCalledWith(TEST_VALIDATOR, 100n * SAFE)
    })

    it('unstakes the whole stake after pressing MAX', () => {
      useUserStakeOnValidator.mockReturnValue({ data: 250n * SAFE + 7n })

      renderDialog()
      fireEvent.click(screen.getByRole('button', { name: 'MAX' }))
      fireEvent.click(startButton())

      expect(initiateWithdrawal).toHaveBeenCalledWith(TEST_VALIDATOR, 250n * SAFE + 7n)
    })

    it('simulates only a submittable amount', () => {
      renderDialog()
      expect(useInitiateWithdrawalSimulation).toHaveBeenLastCalledWith(TEST_VALIDATOR, 0n, false)

      typeAmount('100')
      expect(useInitiateWithdrawalSimulation).toHaveBeenLastCalledWith(
        TEST_VALIDATOR,
        100n * SAFE,
        true,
      )
    })

    it('warns about a failing simulation without blocking submit', () => {
      mockSimulation({ status: 'failed', reason: 'execution reverted: Locked' })

      renderDialog()
      typeAmount('100')

      expect(screen.getByRole('alert')).toHaveTextContent(
        'This transaction will most likely fail: execution reverted: Locked.',
      )
      expect(startButton()).toBeEnabled()
    })

    it('offers a network switch on the wrong network', () => {
      mockWallet({ walletReady: false, wrongNetwork: true })

      renderDialog()

      expect(screen.getByRole('button', { name: `Switch to ${chain.name}` })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Start cooldown' })).not.toBeInTheDocument()
      expect(amountInput()).toBeDisabled()
    })

    it('resets and closes on cancel', () => {
      renderDialog()

      typeAmount('100')
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(reset).toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('transaction progress', () => {
    it('locks the dialog while signing', () => {
      const { rerender } = renderDialog()
      typeAmount('100')

      mockWithdrawal({ isSigningTx: true })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Confirm in your wallet' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled()
    })

    it('reports a Safe-queued unstake', () => {
      const { rerender } = renderDialog()
      typeAmount('100')

      mockWithdrawal({ isSafeQueued: true })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Queued in your Safe' })).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Queued in your Safe', expect.anything())
    })

    it('confirms success with the amount and validator', () => {
      const { rerender } = renderDialog()
      typeAmount('100')

      mockWithdrawal({ isSuccess: true, txHash: TX_HASH })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Transaction confirmed' })).toBeInTheDocument()
      expect(
        screen.getByText('100 SAFE is queued to unstake from Test Validator.'),
      ).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Unstaking started', expect.anything())

      fireEvent.click(screen.getByRole('button', { name: 'Done' }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('toasts a failed unstake and keeps the form usable', () => {
      const { rerender } = renderDialog()
      typeAmount('100')

      mockWithdrawal({ error: new Error('execution reverted') })
      rerender()

      expect(toast.error).toHaveBeenCalledWith('Unstake did not go through', {
        description: 'execution reverted',
      })
      expect(startButton()).toBeEnabled()
    })
  })
})
