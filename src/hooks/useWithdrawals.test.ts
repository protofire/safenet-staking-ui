import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserPendingWithdrawals } from './useWithdrawals'
import { stakingAbi } from '@/abi/stakingAbi'
import { TEST_ACCOUNT } from '@/test/fixtures'
import { stubConnectedAccount, stubDisconnectedAccount, stubRead } from '@/test/wagmiStubs'

const { useAccount, useReadContract, STAKING } = vi.hoisted(() => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  STAKING: '0x0000000000000000000000000000000000000001',
}))

vi.mock('wagmi', () => ({ useAccount, useReadContract }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({
    staking: STAKING,
    token: '0x0000000000000000000000000000000000000002',
  }),
}))

describe('useUserPendingWithdrawals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useReadContract.mockReturnValue(stubRead([]))
  })

  it('polls the connected account pending withdrawals', () => {
    useAccount.mockReturnValue(stubConnectedAccount())

    const { result } = renderHook(() => useUserPendingWithdrawals())

    expect(result.current).toBe(useReadContract.mock.results.at(-1)?.value)
    expect(useReadContract).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'getPendingWithdrawals',
      args: [TEST_ACCOUNT],
      chainId: 11155111,
      query: { enabled: true, refetchInterval: 15_000 },
    })
  })

  it('does not read without a connected account', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    renderHook(() => useUserPendingWithdrawals())

    expect(useReadContract.mock.calls.at(-1)?.[0]).toMatchObject({
      args: undefined,
      query: { enabled: false },
    })
  })
})
