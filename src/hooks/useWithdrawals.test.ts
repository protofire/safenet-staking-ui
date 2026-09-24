import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserPendingWithdrawals } from './useWithdrawals'
import { stubDisconnectedAccount, stubRead } from '@/test/wagmiStubs'

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

  it('does not read without a connected account', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    renderHook(() => useUserPendingWithdrawals())

    expect(useReadContract.mock.calls.at(-1)?.[0]).toMatchObject({
      args: undefined,
      query: { enabled: false },
    })
  })
})
