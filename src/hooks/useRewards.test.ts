import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRewards } from './useRewards'
import { buildRewardProof, SAFE, TEST_ACCOUNT, TEST_MERKLE_ROOT } from '@/test/fixtures'

const { useAccount, useReadContract, useRewardProof, MERKLE_DROP } = vi.hoisted(() => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useRewardProof: vi.fn(),
  MERKLE_DROP: '0x000000000000000000000000000000000000dEaD',
}))

vi.mock('wagmi', () => ({ useAccount, useReadContract }))
vi.mock('./useRewardProof', () => ({ useRewardProof }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({
    staking: '0x0000000000000000000000000000000000000001',
    token: '0x0000000000000000000000000000000000000002',
    merkleDrop: MERKLE_DROP,
  }),
}))

type Reads = {
  cumulativeClaimed?: bigint | undefined
  merkleRoot?: `0x${string}` | undefined
  claimedLoading?: boolean
}

function mockReads({ cumulativeClaimed, merkleRoot, claimedLoading = false }: Reads) {
  useReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === 'cumulativeClaimed') {
      return { data: cumulativeClaimed, isLoading: claimedLoading }
    }
    if (functionName === 'merkleRoot') return { data: merkleRoot, isLoading: false }
    throw new Error(`unexpected read ${functionName}`)
  })
}

describe('useRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue({ address: TEST_ACCOUNT })
    useRewardProof.mockReturnValue({ data: buildRewardProof(), isLoading: false })
    mockReads({ cumulativeClaimed: 400n * SAFE, merkleRoot: TEST_MERKLE_ROOT })
  })

  it('computes claimable as the proof amount minus the on-chain claimed total', () => {
    const { result } = renderHook(() => useRewards())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual({
      claimable: 5_000n * SAFE,
      totalClaimed: 400n * SAFE,
      canClaim: true,
      rootStale: false,
    })
  })

  it('clamps claimable to zero when everything is already claimed', () => {
    mockReads({ cumulativeClaimed: 6_000n * SAFE, merkleRoot: TEST_MERKLE_ROOT })

    const { result } = renderHook(() => useRewards())

    expect(result.current.data.claimable).toBe(0n)
    expect(result.current.data.canClaim).toBe(false)
  })

  it('flags a stale root and blocks claiming when the on-chain root differs', () => {
    mockReads({ cumulativeClaimed: 0n, merkleRoot: `0x${'ab'.repeat(32)}` })

    const { result } = renderHook(() => useRewards())

    expect(result.current.data.rootStale).toBe(true)
    expect(result.current.data.canClaim).toBe(false)
    expect(result.current.data.claimable).toBe(5_400n * SAFE)
  })

  it('does not flag staleness before the on-chain root has loaded', () => {
    mockReads({ cumulativeClaimed: 0n, merkleRoot: undefined })

    const { result } = renderHook(() => useRewards())

    expect(result.current.data.rootStale).toBe(false)
    expect(result.current.data.canClaim).toBe(true)
  })

  it('blocks claiming when the proof has no merkle path', () => {
    useRewardProof.mockReturnValue({ data: buildRewardProof({ proof: null }), isLoading: false })

    const { result } = renderHook(() => useRewards())

    expect(result.current.data.claimable).toBe(5_000n * SAFE)
    expect(result.current.data.canClaim).toBe(false)
  })

  it('returns empty data while the proof is loading', () => {
    useRewardProof.mockReturnValue({ data: undefined, isLoading: true })

    const { result } = renderHook(() => useRewards())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data.claimable).toBe(0n)
  })

  it('returns empty data while the claimed total is loading', () => {
    mockReads({ cumulativeClaimed: undefined, claimedLoading: true })

    const { result } = renderHook(() => useRewards())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data.canClaim).toBe(false)
  })

  it('returns empty data when the address has no proof', () => {
    useRewardProof.mockReturnValue({ data: null, isLoading: false })

    const { result } = renderHook(() => useRewards())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual({
      claimable: 0n,
      totalClaimed: 0n,
      canClaim: false,
      rootStale: false,
    })
  })

  it('only reads the contract once a proof exists', () => {
    useRewardProof.mockReturnValue({ data: undefined, isLoading: true })

    renderHook(() => useRewards())

    const calls = useReadContract.mock.calls as [
      { functionName: string; query: { enabled: boolean } },
    ][]
    expect(new Set(calls.map(([opts]) => opts.functionName))).toEqual(
      new Set(['cumulativeClaimed', 'merkleRoot']),
    )
    expect(calls.every(([opts]) => opts.query.enabled === false)).toBe(true)
  })
})
