import { renderHook } from '@testing-library/react'
import { maxUint256 } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTokenAllowance } from './useTokenAllowance'
import { erc20Abi } from '@/abi/erc20Abi'
import { TEST_ACCOUNT } from '@/test/fixtures'
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

  it('reads the allowance granted to the staking contract', () => {
    const { result } = renderHook(() => useTokenAllowance())

    expect(result.current.allowance).toBe(10n)
    expect(useReadContract).toHaveBeenCalledWith({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [TEST_ACCOUNT, STAKING],
      chainId: 11155111,
      query: { enabled: true },
    })
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

  it('only invalidates the allowance after approving', () => {
    renderHook(() => useTokenAllowance())

    expect(useContractTx).toHaveBeenCalledWith({ functionNames: ['allowance'] })
  })

  it('approves the staking contract for the exact amount', () => {
    const { result } = renderHook(() => useTokenAllowance())
    result.current.approve(5n)

    expect(write).toHaveBeenCalledWith({
      address: TOKEN,
      abi: erc20Abi,
      functionName: 'approve',
      args: [STAKING, 5n],
    })
  })

  it('approves the maximum amount for an unlimited approval', () => {
    const { result } = renderHook(() => useTokenAllowance())
    result.current.approveUnlimited()

    expect(write.mock.calls[0]?.[0].args).toEqual([STAKING, maxUint256])
  })

  it('maps tx state to approval state', () => {
    const error = new Error('boom')
    mockTx({
      isSigningTx: true,
      isConfirmingTx: true,
      isSuccess: true,
      isSafeQueued: true,
      error,
      txHash: '0xabc',
    })

    const { result } = renderHook(() => useTokenAllowance())

    expect(result.current).toMatchObject({
      isSigningApproval: true,
      isConfirmingApproval: true,
      isApproved: true,
      isSafeApprovalQueued: true,
      approvalError: error,
      approvalTxHash: '0xabc',
      resetApproval: reset,
    })
  })
})
