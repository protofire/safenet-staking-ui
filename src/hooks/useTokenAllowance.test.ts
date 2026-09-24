import { renderHook } from '@testing-library/react'
import { maxUint256 } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTokenAllowance } from './useTokenAllowance'
import { stubConnectedAccount, stubDisconnectedAccount, stubRead } from '@/test/wagmiStubs'

const { useAccount, useReadContract, useContractTx, STAKING, TOKEN } = vi.hoisted(() => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useContractTx: vi.fn(),
  STAKING: '0x0000000000000000000000000000000000000001',
  TOKEN: '0x0000000000000000000000000000000000000002',
}))

vi.mock('wagmi', () => ({ useAccount, useReadContract }))
vi.mock('./useContractTx', () => ({ useContractTx }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({ staking: STAKING, token: TOKEN }),
}))

const write = vi.fn()
const reset = vi.fn()

function mockTx(overrides: Record<string, unknown> = {}) {
  useContractTx.mockReturnValue({
    write,
    reset,
    isSigningTx: false,
    isConfirmingTx: false,
    isSuccess: false,
    isSafeQueued: false,
    error: null,
    txHash: undefined,
    ...overrides,
  })
}

describe('useTokenAllowance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue(stubConnectedAccount())
    useReadContract.mockReturnValue(stubRead(10n))
    mockTx()
  })

  it('does not read without a connected account', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())
    useReadContract.mockReturnValue(stubRead(undefined))

    const { result } = renderHook(() => useTokenAllowance())

    expect(result.current.allowance).toBeUndefined()
    expect(useReadContract.mock.calls.at(-1)?.[0]).toMatchObject({
      args: undefined,
      query: { enabled: false },
    })
  })

  it('treats non-bigint read data as unknown', () => {
    useReadContract.mockReturnValue(stubRead('10'))

    const { result } = renderHook(() => useTokenAllowance())

    expect(result.current.allowance).toBeUndefined()
  })

  it('approves the maximum amount for an unlimited approval', () => {
    const { result } = renderHook(() => useTokenAllowance())
    result.current.approveUnlimited()

    expect(write.mock.calls[0]?.[0].args).toEqual([STAKING, maxUint256])
  })
})
