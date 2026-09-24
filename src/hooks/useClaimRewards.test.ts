import { renderHook } from '@testing-library/react'
import { getAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { merkleDropAbi } from '@/abi/merkleDropAbi'
import { buildRewardProof, TEST_ACCOUNT, TEST_MERKLE_ROOT } from '@/test/fixtures'

const { useContractTx, useTxSimulation, contracts } = vi.hoisted(() => ({
  useContractTx: vi.fn(),
  useTxSimulation: vi.fn(),
  contracts: { merkleDrop: undefined as string | undefined },
}))

vi.mock('./useContractTx', () => ({ useContractTx }))
vi.mock('./useTxSimulation', () => ({ useTxSimulation, IDLE_SIMULATION: { status: 'idle' } }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({
    staking: '0x0000000000000000000000000000000000000001',
    token: '0x0000000000000000000000000000000000000002',
    ...(contracts.merkleDrop ? { merkleDrop: contracts.merkleDrop } : {}),
  }),
}))

const MERKLE_DROP = '0x000000000000000000000000000000000000dEaD'
const PROOF = buildRewardProof().proof ?? []
const AMOUNT = 5_400n
const CHECKSUMMED_ACCOUNT = getAddress(TEST_ACCOUNT)

const write = vi.fn()

async function loadHooks(merkleDrop: string | undefined) {
  contracts.merkleDrop = merkleDrop
  vi.resetModules()
  return import('./useClaimRewards')
}

beforeEach(() => {
  vi.clearAllMocks()
  useContractTx.mockReturnValue({ write, isSuccess: false })
  useTxSimulation.mockReturnValue({ status: 'ok' })
})

describe('useClaimRewards', () => {
  it('claims with a checksummed account and refreshes reward reads', async () => {
    const { useClaimRewards } = await loadHooks(MERKLE_DROP)

    const { result } = renderHook(() => useClaimRewards())
    result.current.claimRewards(
      TEST_ACCOUNT.toLowerCase() as typeof TEST_ACCOUNT,
      AMOUNT,
      TEST_MERKLE_ROOT,
      PROOF,
    )

    expect(useContractTx).toHaveBeenCalledWith({
      functionNames: ['cumulativeClaimed', 'balanceOf'],
      extraKeys: [['rewardProof']],
    })
    expect(write).toHaveBeenCalledWith({
      address: MERKLE_DROP,
      abi: merkleDropAbi,
      functionName: 'claim',
      args: [CHECKSUMMED_ACCOUNT, AMOUNT, TEST_MERKLE_ROOT, PROOF],
    })
  })

  it('does nothing when no merkle drop contract is configured', async () => {
    const { useClaimRewards } = await loadHooks(undefined)

    const { result } = renderHook(() => useClaimRewards())
    result.current.claimRewards(TEST_ACCOUNT, AMOUNT, TEST_MERKLE_ROOT, PROOF)

    expect(write).not.toHaveBeenCalled()
  })
})

describe('useClaimRewardsSimulation', () => {
  const args = {
    account: TEST_ACCOUNT.toLowerCase() as typeof TEST_ACCOUNT,
    cumulativeAmount: AMOUNT,
    expectedMerkleRoot: TEST_MERKLE_ROOT,
    merkleProof: PROOF,
  }

  it('simulates the claim with a checksummed account', async () => {
    const { useClaimRewardsSimulation } = await loadHooks(MERKLE_DROP)

    const { result } = renderHook(() => useClaimRewardsSimulation(args, true))

    expect(result.current).toEqual({ status: 'ok' })
    expect(useTxSimulation).toHaveBeenCalledWith(
      {
        address: MERKLE_DROP,
        abi: merkleDropAbi,
        functionName: 'claim',
        args: [CHECKSUMMED_ACCOUNT, AMOUNT, TEST_MERKLE_ROOT, PROOF],
      },
      true,
    )
  })

  it('passes nothing to simulate until claim args exist', async () => {
    const { useClaimRewardsSimulation } = await loadHooks(MERKLE_DROP)

    renderHook(() => useClaimRewardsSimulation(undefined, true))

    expect(useTxSimulation).toHaveBeenCalledWith(undefined, true)
  })

  it('stays idle when no merkle drop contract is configured', async () => {
    const { useClaimRewardsSimulation } = await loadHooks(undefined)

    const { result } = renderHook(() => useClaimRewardsSimulation(args, true))

    expect(result.current).toEqual({ status: 'idle' })
    expect(useTxSimulation).toHaveBeenCalledWith(undefined, true)
  })
})
