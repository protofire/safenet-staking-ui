import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClaimRewardsDialog } from './ClaimRewardsDialog'
import { TX_CHECK_COPY } from '@/components/ui/tx-check-notice'
import type { usePortfolioRewardsModels } from '@/hooks/usePortfolioRewardsModels'
import { buildRewardProof, SAFE, TEST_ACCOUNT, TEST_MERKLE_ROOT } from '@/test/fixtures'
import { stubConnectedAccount } from '@/test/wagmiStubs'

const {
  useAccount,
  useWalletReady,
  useClaimRewards,
  useClaimRewardsSimulation,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  useAccount: vi.fn(),
  useWalletReady: vi.fn(),
  useClaimRewards: vi.fn(),
  useClaimRewardsSimulation: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('wagmi', () => ({
  useAccount,
  useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useWalletReady', () => ({ useWalletReady }))
vi.mock('@/hooks/useClaimRewards', () => ({ useClaimRewards, useClaimRewardsSimulation }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))

type Model = ReturnType<typeof usePortfolioRewardsModels>

const TX_HASH = `0x${'cd'.repeat(32)}` as const
const PROOF = buildRewardProof()

const claimRewards = vi.fn()
const reset = vi.fn()

function buildModel(
  overrides: Partial<Model> = {},
  rewards: Partial<Model['rewards']> = {},
): Model {
  return {
    merkleDrop: '0x000000000000000000000000000000000000dEaD',
    rewards: {
      claimable: 5_000n * SAFE,
      totalClaimed: 400n * SAFE,
      canClaim: true,
      rootStale: false,
      ...rewards,
    },
    proof: PROOF,
    rewardsInfoNote: null,
    loading: false,
    isError: false,
    ...overrides,
  }
}

function mockTx(overrides: Record<string, unknown> = {}) {
  useClaimRewards.mockReturnValue({
    claimRewards,
    isSigningTx: false,
    isConfirmingTx: false,
    isSafeQueued: false,
    isSuccess: false,
    error: null,
    reset,
    txHash: undefined,
    ...overrides,
  })
}

function mockWallet({ ready = true, wrongNetwork = false } = {}) {
  useWalletReady.mockReturnValue({
    walletReady: ready,
    wrongNetwork,
    expectedChain: { id: 11155111, name: 'Sepolia' },
  })
}

function renderDialog(model: Model = buildModel()) {
  const onOpenChange = vi.fn()
  const view = render(<ClaimRewardsDialog open onOpenChange={onOpenChange} model={model} />)
  const rerender = (next: Model = model) =>
    view.rerender(<ClaimRewardsDialog open onOpenChange={onOpenChange} model={next} />)
  return { onOpenChange, rerender, dialog: () => screen.getByRole('dialog') }
}

function claimButton() {
  return within(screen.getByRole('dialog')).getByRole('button', { name: 'Claim rewards' })
}

describe('ClaimRewardsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue(stubConnectedAccount())
    mockWallet()
    mockTx()
    useClaimRewardsSimulation.mockReturnValue({ status: 'ok' })
  })

  it('shows the claimable amount', () => {
    const { dialog } = renderDialog()

    expect(dialog()).toHaveTextContent(/Claimable\s*5,000\s*SAFE/)
  })

  it('claims with the proof arguments', () => {
    renderDialog()

    fireEvent.click(claimButton())

    expect(claimRewards).toHaveBeenCalledWith(
      TEST_ACCOUNT,
      BigInt(PROOF.cumulativeAmount),
      TEST_MERKLE_ROOT,
      PROOF.proof,
    )
  })

  it('simulates the claim with the proof while idle', () => {
    renderDialog()

    expect(useClaimRewardsSimulation).toHaveBeenLastCalledWith(
      {
        account: TEST_ACCOUNT,
        cumulativeAmount: BigInt(PROOF.cumulativeAmount),
        expectedMerkleRoot: TEST_MERKLE_ROOT,
        merkleProof: PROOF.proof,
      },
      true,
    )
  })

  it('skips the simulation when the proof has no merkle path', () => {
    renderDialog(buildModel({ proof: buildRewardProof({ proof: null }) }))

    expect(useClaimRewardsSimulation.mock.lastCall?.[0]).toBeUndefined()
  })

  it.each([
    ['nothing can be claimed', buildModel({}, { canClaim: false })],
    ['the merkle root is stale', buildModel({}, { rootStale: true, canClaim: false })],
    ['rewards are loading', buildModel({ loading: true })],
  ])('disables the claim when %s', (_name, model) => {
    renderDialog(model)

    expect(claimButton()).toBeDisabled()
    expect(useClaimRewardsSimulation.mock.lastCall?.[1]).toBe(false)
  })

  it('disables the claim when the wallet is not ready', () => {
    mockWallet({ ready: false })

    renderDialog()

    expect(claimButton()).toBeDisabled()
  })

  it('warns when the simulation predicts a revert', () => {
    useClaimRewardsSimulation.mockReturnValue({ status: 'failed', reason: 'InvalidProof' })

    const { dialog } = renderDialog()

    expect(within(dialog()).getByRole('alert')).toHaveTextContent(
      `${TX_CHECK_COPY.failed}: InvalidProof.`,
    )
    expect(claimButton()).toBeEnabled()
  })

  it('shows a load error instead of the claim form', () => {
    const { dialog } = renderDialog(buildModel({ isError: true }))

    expect(within(dialog()).getByRole('alert')).toHaveTextContent('Failed to load reward data')
    expect(within(dialog()).queryByRole('button', { name: 'Claim rewards' })).toBeNull()
  })

  it('shows signing progress and locks dismissal', () => {
    mockTx({ isSigningTx: true })

    const { dialog, onOpenChange } = renderDialog()

    expect(
      within(dialog()).getByRole('heading', { name: 'Confirm in your wallet' }),
    ).toBeInTheDocument()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('toasts once when the transaction is queued in Safe', () => {
    mockTx({ isSafeQueued: true })

    const { rerender } = renderDialog()
    rerender()

    expect(toastSuccess).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalledWith('Transaction queued in Safe', expect.anything())
  })

  it('toasts claim failures', () => {
    mockTx({ error: new Error('execution reverted') })

    renderDialog()

    expect(toastError).toHaveBeenCalledWith('Claim failed', {
      description: 'execution reverted',
    })
  })

  it('reports the claimed amount on success and resets on Done', () => {
    const { rerender, dialog, onOpenChange } = renderDialog()
    fireEvent.click(claimButton())

    mockTx({ isSuccess: true, txHash: TX_HASH })
    rerender(buildModel({}, { claimable: 0n, canClaim: false }))

    expect(dialog()).toHaveTextContent('Claimed 5,000 SAFE to your wallet.')
    expect(toastSuccess).toHaveBeenCalledWith('Rewards claimed', {
      description: 'Claimed 5,000 SAFE',
    })

    fireEvent.click(within(dialog()).getByRole('button', { name: 'Done' }))
    expect(reset).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes when the connected wallet changes', () => {
    const { rerender, onOpenChange } = renderDialog()

    useAccount.mockReturnValue(
      stubConnectedAccount({ address: '0x2222222222222222222222222222222222222222' }),
    )
    rerender()

    expect(reset).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
