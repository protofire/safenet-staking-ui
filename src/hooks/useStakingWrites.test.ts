import { renderHook } from '@testing-library/react'
import { encodeFunctionData } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useBatchClaimWithdrawals, useBatchStake } from './useStakingWrites'
import { erc20Abi } from '@/abi/erc20Abi'
import { stakingAbi } from '@/abi/stakingAbi'
import { TEST_VALIDATOR } from '@/test/fixtures'

const { useContractTx, useBatchContractTx, useTxSimulation, STAKING, TOKEN } = vi.hoisted(() => ({
  useContractTx: vi.fn(),
  useBatchContractTx: vi.fn(),
  useTxSimulation: vi.fn(),
  STAKING: '0x0000000000000000000000000000000000000001' as const,
  TOKEN: '0x0000000000000000000000000000000000000002' as const,
}))

vi.mock('./useContractTx', () => ({ useContractTx, useBatchContractTx }))
vi.mock('./useTxSimulation', () => ({ useTxSimulation }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({ staking: STAKING, token: TOKEN }),
}))

const sendCalls = vi.fn()

const CLAIM_CALL = {
  to: STAKING,
  data: encodeFunctionData({ abi: stakingAbi, functionName: 'claimWithdrawal' }),
}

beforeEach(() => {
  vi.clearAllMocks()
  useBatchContractTx.mockReturnValue({ sendCalls, supportsBatching: true })
})

describe('useBatchStake', () => {
  it('batches an exact approval followed by the stake', () => {
    const { result } = renderHook(() => useBatchStake())
    result.current.batchApproveAndStake(TEST_VALIDATOR, 9n)

    expect(sendCalls).toHaveBeenCalledWith([
      {
        to: TOKEN,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [STAKING, 9n],
        }),
      },
      {
        to: STAKING,
        data: encodeFunctionData({
          abi: stakingAbi,
          functionName: 'stake',
          args: [TEST_VALIDATOR, 9n],
        }),
      },
    ])
    expect(result.current.supportsBatching).toBe(true)
  })
})

describe('useBatchClaimWithdrawals', () => {
  it('sends one claim call per claimable withdrawal', () => {
    const { result } = renderHook(() => useBatchClaimWithdrawals())
    result.current.batchClaimWithdrawals(3)

    expect(sendCalls).toHaveBeenCalledWith([CLAIM_CALL, CLAIM_CALL, CLAIM_CALL])
  })

  it.each([0, -1])('does nothing for a claim count of %d', (count) => {
    const { result } = renderHook(() => useBatchClaimWithdrawals())
    result.current.batchClaimWithdrawals(count)

    expect(sendCalls).not.toHaveBeenCalled()
  })
})
