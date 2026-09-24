import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StakeDialog } from './StakeDialog'
import { chain } from '@/config/chains'
import type { TxSimulation } from '@/hooks/useTxSimulation'
import { buildValidator, SAFE, TEST_ACCOUNT, TEST_VALIDATOR } from '@/test/fixtures'
import { stubConnectedAccount } from '@/test/wagmiStubs'

const {
  toast,
  useAccount,
  useSwitchChain,
  useWalletReady,
  useTokenBalance,
  useValidators,
  useApprovalFlow,
  useStake,
  useBatchStake,
  useStakeSimulation,
  useWithdrawDelay,
  useUserStakeOnValidator,
} = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useAccount: vi.fn(),
  useSwitchChain: vi.fn(),
  useWalletReady: vi.fn(),
  useTokenBalance: vi.fn(),
  useValidators: vi.fn(),
  useApprovalFlow: vi.fn(),
  useStake: vi.fn(),
  useBatchStake: vi.fn(),
  useStakeSimulation: vi.fn(),
  useWithdrawDelay: vi.fn(),
  useUserStakeOnValidator: vi.fn(),
}))

vi.mock('sonner', () => ({ toast }))
vi.mock('wagmi', () => ({ useAccount, useSwitchChain }))
vi.mock('@/hooks/useWalletReady', () => ({ useWalletReady }))
vi.mock('@/hooks/useTokenBalance', () => ({ useTokenBalance }))
vi.mock('@/hooks/useValidators', () => ({ useValidators }))
vi.mock('@/hooks/useApprovalFlow', () => ({ useApprovalFlow }))
vi.mock('@/hooks/useStakingWrites', () => ({ useStake, useBatchStake, useStakeSimulation }))
vi.mock('@/hooks/useStakingReads', () => ({ useWithdrawDelay, useUserStakeOnValidator }))

const TX_HASH = `0x${'ab'.repeat(32)}` as const
const APPROVAL_HASH = `0x${'cd'.repeat(32)}` as const

const stake = vi.fn()
const resetStake = vi.fn()
const batchApproveAndStake = vi.fn()
const resetBatch = vi.fn()
const approveExact = vi.fn()
const approveUnlimited = vi.fn()
const resetApprovalFlow = vi.fn()
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

function mockApproval({
  allowance = 1_000_000n * SAFE,
  ...overrides
}: { allowance?: bigint } & Record<string, unknown> = {}) {
  useApprovalFlow.mockImplementation((parsedAmount: bigint) => ({
    needsApproval: parsedAmount > 0n && allowance < parsedAmount,
    approvalType: null,
    approvedInSession: false,
    isApprovalPending: false,
    isSigningApproval: false,
    isConfirmingApproval: false,
    isSafeApprovalQueued: false,
    approvalTxHash: undefined,
    approveExact,
    approveUnlimited,
    resetApprovalFlow,
    ...overrides,
  }))
}

function mockStake(overrides: Record<string, unknown> = {}) {
  useStake.mockReturnValue({
    stake,
    isSigningTx: false,
    isConfirmingTx: false,
    isSuccess: false,
    isSafeQueued: false,
    error: null,
    reset: resetStake,
    txHash: undefined,
    ...overrides,
  })
}

function mockBatch(overrides: Record<string, unknown> = {}) {
  useBatchStake.mockReturnValue({
    batchApproveAndStake,
    supportsBatching: false,
    isSigningTx: false,
    isConfirmingTx: false,
    isSuccess: false,
    isSafeQueued: false,
    isReverted: false,
    error: null,
    reset: resetBatch,
    txHash: undefined,
    ...overrides,
  })
}

function mockSimulation(simulation: TxSimulation) {
  useStakeSimulation.mockReturnValue(simulation)
}

function renderDialog() {
  const view = render(<StakeDialog validator={TEST_VALIDATOR} open onOpenChange={onOpenChange} />)
  return {
    ...view,
    rerender: () =>
      view.rerender(<StakeDialog validator={TEST_VALIDATOR} open onOpenChange={onOpenChange} />),
  }
}

function amountInput() {
  return screen.getByLabelText('Amount')
}

function typeAmount(value: string) {
  fireEvent.change(amountInput(), { target: { value } })
}

function button(name: string | RegExp) {
  return screen.getByRole('button', { name })
}

describe('StakeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue(stubConnectedAccount())
    useSwitchChain.mockReturnValue({ switchChain: vi.fn(), isPending: false })
    mockWallet()
    useTokenBalance.mockReturnValue({ data: 100n * SAFE })
    useValidators.mockReturnValue({ data: [buildValidator()], isError: false })
    useWithdrawDelay.mockReturnValue({ data: 7n * 86_400n })
    useUserStakeOnValidator.mockReturnValue({ data: 250n * SAFE })
    mockApproval()
    mockStake()
    mockBatch()
    mockSimulation({ status: 'ok' })
  })

  describe('form', () => {
    it('shows the validator, balance, current delegation and cooldown', () => {
      renderDialog()

      expect(screen.getByRole('dialog', { name: 'Stake SAFE' })).toBeInTheDocument()
      expect(screen.getByText('Test Validator')).toBeInTheDocument()
      expect(screen.getByText('250 SAFE')).toBeInTheDocument()
      expect(amountInput()).toHaveAccessibleDescription('Wallet balance: 100 SAFE')
      expect(screen.getByText('7 days')).toBeInTheDocument()
    })

    it('disables Stake until an amount is entered', () => {
      renderDialog()

      expect(button('Stake')).toBeDisabled()
    })

    it('keeps Stake disabled for a zero amount', () => {
      renderDialog()

      typeAmount('0')

      expect(button('Stake')).toBeDisabled()
    })

    it('flags an amount above the wallet balance', () => {
      renderDialog()

      typeAmount('100.5')

      expect(amountInput()).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText('Insufficient SAFE.')).toBeInTheDocument()
      expect(button('Stake')).toBeDisabled()
    })

    it('blocks input when the wallet holds no SAFE', () => {
      useTokenBalance.mockReturnValue({ data: 0n })

      renderDialog()

      expect(screen.getByText('You do not have enough SAFE to stake.')).toBeInTheDocument()
      expect(amountInput()).toBeDisabled()
      expect(button('MAX')).toBeDisabled()
    })

    it('stakes the entered amount to the validator', () => {
      renderDialog()

      typeAmount('5')
      fireEvent.click(button('Stake'))

      expect(stake).toHaveBeenCalledWith(TEST_VALIDATOR, 5n * SAFE)
    })

    it('stakes the full balance after pressing MAX', () => {
      useTokenBalance.mockReturnValue({ data: 12n * SAFE + 1n })

      renderDialog()

      fireEvent.click(button('MAX'))
      expect(amountInput()).toHaveValue('12.000000000000000001')
      fireEvent.click(button('Stake'))

      expect(stake).toHaveBeenCalledWith(TEST_VALIDATOR, 12n * SAFE + 1n)
    })

    it('simulates only a submittable amount', () => {
      renderDialog()

      expect(useStakeSimulation).toHaveBeenLastCalledWith(TEST_VALIDATOR, 0n, false)

      typeAmount('5')

      expect(useStakeSimulation).toHaveBeenLastCalledWith(TEST_VALIDATOR, 5n * SAFE, true)
    })

    it('warns with the revert reason when the simulation fails but still allows submitting', () => {
      mockSimulation({ status: 'failed', reason: 'execution reverted: Paused' })

      renderDialog()
      typeAmount('5')

      expect(screen.getByRole('alert')).toHaveTextContent(
        'This transaction will most likely fail: execution reverted: Paused.',
      )
      expect(button('Stake')).toBeEnabled()
    })

    it('notes when the simulation could not run', () => {
      mockSimulation({ status: 'unavailable' })

      renderDialog()

      expect(screen.getByText(/Could not check this transaction/)).toBeInTheDocument()
    })

    it('closes and resets everything on cancel', () => {
      renderDialog()

      typeAmount('5')
      fireEvent.click(button('Cancel'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(resetApprovalFlow).toHaveBeenCalled()
      expect(resetStake).toHaveBeenCalled()
      expect(resetBatch).toHaveBeenCalled()
    })

    it('offers a network switch instead of staking on the wrong network', () => {
      mockWallet({ walletReady: false, wrongNetwork: true })

      renderDialog()

      expect(screen.getByRole('alert')).toHaveTextContent(/different network/)
      expect(button(`Switch to ${chain.name}`)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Stake' })).not.toBeInTheDocument()
      expect(amountInput()).toBeDisabled()
    })
  })

  describe('validator registry', () => {
    it('blocks staking while the registry is loading', () => {
      useValidators.mockReturnValue({ data: undefined, isError: false })

      renderDialog()

      expect(amountInput()).toBeDisabled()
      expect(button('Stake')).toBeDisabled()
    })

    it('blocks staking when the registry fails to load', () => {
      useValidators.mockReturnValue({ data: undefined, isError: true })

      renderDialog()

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load validators')
      expect(amountInput()).toBeDisabled()
    })

    it('blocks staking to a validator missing from the registry', () => {
      useValidators.mockReturnValue({
        data: [buildValidator({ address: '0x2222222222222222222222222222222222222222' })],
        isError: false,
      })

      renderDialog()

      expect(screen.getByRole('alert')).toHaveTextContent('not in the validator registry')
      expect(amountInput()).toBeDisabled()
      expect(button('Stake')).toBeDisabled()
    })

    it('blocks new stakes on an inactive validator', () => {
      useValidators.mockReturnValue({ data: [buildValidator({ isActive: false })], isError: false })

      renderDialog()

      expect(screen.getByText(/This validator is inactive/)).toBeInTheDocument()
      expect(amountInput()).toBeDisabled()
    })
  })

  describe('approval', () => {
    beforeEach(() => {
      mockApproval({ allowance: 0n })
    })

    it('replaces Stake with an approval step when the allowance is too low', () => {
      renderDialog()

      typeAmount('5')

      expect(screen.queryByRole('button', { name: 'Stake' })).not.toBeInTheDocument()
      const steps = within(screen.getByRole('list', { name: 'Transaction steps' })).getAllByRole(
        'listitem',
      )
      expect(steps[0]).toHaveAttribute('aria-current', 'step')
      expect(steps[0]).toHaveTextContent('Approve SAFE')
      expect(steps[1]).not.toHaveAttribute('aria-current')
    })

    it('approves the exact amount by default', () => {
      renderDialog()

      typeAmount('5')
      fireEvent.click(button('Approve SAFE'))

      expect(approveExact).toHaveBeenCalledTimes(1)
      expect(approveUnlimited).not.toHaveBeenCalled()
    })

    it('offers unlimited approval on request', () => {
      renderDialog()

      typeAmount('5')
      expect(screen.queryByRole('button', { name: 'Approve unlimited' })).not.toBeInTheDocument()
      fireEvent.click(button('Use unlimited approval instead'))
      fireEvent.click(button('Approve unlimited'))

      expect(approveUnlimited).toHaveBeenCalledTimes(1)
      expect(approveExact).not.toHaveBeenCalled()
    })

    it('marks approval done and enables Stake after approving in this session', () => {
      mockApproval({ approvedInSession: true })

      renderDialog()
      typeAmount('5')

      const steps = within(screen.getByRole('list', { name: 'Transaction steps' })).getAllByRole(
        'listitem',
      )
      expect(steps[0]).toHaveTextContent('Approved')
      expect(steps[1]).toHaveAttribute('aria-current', 'step')
      expect(button('Stake')).toBeEnabled()
    })

    it('uses one bundled action when the wallet supports batching', () => {
      mockBatch({ supportsBatching: true })

      renderDialog()
      typeAmount('5')

      expect(screen.queryByRole('list', { name: 'Transaction steps' })).not.toBeInTheDocument()
      expect(screen.getByText(/bundles the approval and the stake/)).toBeInTheDocument()
      fireEvent.click(button('Approve & stake'))

      expect(batchApproveAndStake).toHaveBeenCalledWith(TEST_VALIDATOR, 5n * SAFE)
      expect(approveExact).not.toHaveBeenCalled()
    })

    it('disables the bundled action for an amount above the balance', () => {
      mockBatch({ supportsBatching: true })

      renderDialog()
      typeAmount('500')

      expect(button('Approve & stake')).toBeDisabled()
    })
  })

  describe('transaction progress', () => {
    it('asks for a signature and locks the dialog while signing the stake', () => {
      const { rerender } = renderDialog()
      typeAmount('5')

      mockStake({ isSigningTx: true })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Confirm in your wallet' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
      expect(button('Close dialog')).toBeDisabled()
    })

    it('describes the approval with the step title while it is signed', () => {
      mockApproval({ allowance: 0n })
      const { rerender } = renderDialog()
      typeAmount('5')

      mockApproval({
        allowance: 0n,
        approvalType: 'exact',
        isApprovalPending: true,
        isSigningApproval: true,
        approvalTxHash: APPROVAL_HASH,
      })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Step 1 of 2 · Approve SAFE' })).toBeInTheDocument()
      expect(screen.getByText('Allow the staking contract to use 5 SAFE.')).toBeInTheDocument()
    })

    it('tells the user the stake is queued in Safe', () => {
      const { rerender } = renderDialog()
      typeAmount('5')

      mockStake({ isSafeQueued: true })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Queued in your Safe' })).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Queued in your Safe', expect.anything())
    })

    it('confirms success with the amount and validator, then closes on Done', () => {
      const { rerender } = renderDialog()
      typeAmount('5')

      mockStake({ isSuccess: true, txHash: TX_HASH })
      rerender()

      expect(screen.getByRole('dialog', { name: 'Transaction confirmed' })).toBeInTheDocument()
      expect(screen.getByText('Staked 5 SAFE to Test Validator.')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Stake confirmed', {
        description: '5 SAFE is now staked to Test Validator.',
      })

      fireEvent.click(button('Done'))
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(resetStake).toHaveBeenCalled()
    })

    it('toasts a failed stake with the error message', () => {
      const { rerender } = renderDialog()
      typeAmount('5')

      mockStake({ error: new Error('execution reverted') })
      rerender()

      expect(toast.error).toHaveBeenCalledWith('Stake did not go through', {
        description: 'execution reverted',
      })
      expect(button('Stake')).toBeEnabled()
    })

    it('toasts and resets a reverted batch', () => {
      mockBatch({ supportsBatching: true, isReverted: true })

      renderDialog()

      expect(toast.error).toHaveBeenCalledWith('Batch reverted onchain', expect.anything())
      expect(resetBatch).toHaveBeenCalled()
    })
  })
})
