import { renderHook } from '@testing-library/react'
import { encodeFunctionData } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useBatchClaimWithdrawals,
  useBatchStake,
  useClaimWithdrawal,
  useClaimWithdrawalSimulation,
  useInitiateWithdrawal,
  useInitiateWithdrawalSimulation,
  useStake,
  useStakeSimulation,
} from './useStakingWrites'
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

const write = vi.fn()
const sendCalls = vi.fn()

const STAKING_FUNCTIONS = [
  'totalStakedAmount',
  'totalStakerStakes',
  'stakes',
  'totalValidatorStakes',
  'totalPendingWithdrawals',
  'getPendingWithdrawals',
  'getNextClaimableWithdrawal',
  'balanceOf',
  'allowance',
]

const CLAIM_CALL = {
  to: STAKING,
  data: encodeFunctionData({ abi: stakingAbi, functionName: 'claimWithdrawal' }),
}

beforeEach(() => {
  vi.clearAllMocks()
  useContractTx.mockReturnValue({ write, isSuccess: false, txHash: undefined })
  useBatchContractTx.mockReturnValue({ sendCalls, supportsBatching: true })
  useTxSimulation.mockReturnValue({ status: 'ok' })
})

describe('staking invalidation', () => {
  it.each([
    ['useStake', useStake],
    ['useInitiateWithdrawal', useInitiateWithdrawal],
    ['useClaimWithdrawal', useClaimWithdrawal],
  ])('%s refreshes every staking read and the validator feed', (_name, hook) => {
    renderHook(() => hook())

    expect(useContractTx).toHaveBeenCalledWith({
      functionNames: STAKING_FUNCTIONS,
      extraKeys: [['validators']],
    })
  })

  it.each([
    ['useBatchStake', useBatchStake],
    ['useBatchClaimWithdrawals', useBatchClaimWithdrawals],
  ])('%s refreshes every staking read and the validator feed', (_name, hook) => {
    renderHook(() => hook())

    expect(useBatchContractTx).toHaveBeenCalledWith({
      functionNames: STAKING_FUNCTIONS,
      extraKeys: [['validators']],
    })
  })
})

describe('useStake', () => {
  it('stakes the amount on the validator and passes through tx state', () => {
    useContractTx.mockReturnValue({ write, isSuccess: true, txHash: '0xabc' })

    const { result } = renderHook(() => useStake())
    result.current.stake(TEST_VALIDATOR, 5n)

    expect(write).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'stake',
      args: [TEST_VALIDATOR, 5n],
    })
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.txHash).toBe('0xabc')
    expect(result.current).not.toHaveProperty('write')
  })
})

describe('useInitiateWithdrawal', () => {
  it('initiates a withdrawal of the amount from the validator', () => {
    const { result } = renderHook(() => useInitiateWithdrawal())
    result.current.initiateWithdrawal(TEST_VALIDATOR, 7n)

    expect(write).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'initiateWithdrawal',
      args: [TEST_VALIDATOR, 7n],
    })
  })
})

describe('useClaimWithdrawal', () => {
  it('claims the next withdrawal without arguments', () => {
    const { result } = renderHook(() => useClaimWithdrawal())
    result.current.claimWithdrawal()

    expect(write).toHaveBeenCalledWith({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'claimWithdrawal',
    })
  })
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

describe('simulations', () => {
  it('simulates the stake call', () => {
    const { result } = renderHook(() => useStakeSimulation(TEST_VALIDATOR, 5n, true))

    expect(useTxSimulation).toHaveBeenCalledWith(
      { address: STAKING, abi: stakingAbi, functionName: 'stake', args: [TEST_VALIDATOR, 5n] },
      true,
    )
    expect(result.current).toEqual({ status: 'ok' })
  })

  it('simulates the withdrawal call', () => {
    renderHook(() => useInitiateWithdrawalSimulation(TEST_VALIDATOR, 5n, false))

    expect(useTxSimulation).toHaveBeenCalledWith(
      {
        address: STAKING,
        abi: stakingAbi,
        functionName: 'initiateWithdrawal',
        args: [TEST_VALIDATOR, 5n],
      },
      false,
    )
  })

  it('simulates the claim call', () => {
    renderHook(() => useClaimWithdrawalSimulation(true))

    expect(useTxSimulation).toHaveBeenCalledWith(
      { address: STAKING, abi: stakingAbi, functionName: 'claimWithdrawal' },
      true,
    )
  })
})
