import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useUserStakeOnValidator,
  useUserStakesOnValidators,
  useUserTotalStake,
  useValidatorTotalStakes,
  useWithdrawDelay,
} from './useStakingReads'
import { stakingAbi } from '@/abi/stakingAbi'
import { TEST_ACCOUNT, TEST_VALIDATOR } from '@/test/fixtures'
import { stubConnectedAccount, stubDisconnectedAccount, stubRead } from '@/test/wagmiStubs'

const { useAccount, useReadContract, useReadContracts, STAKING } = vi.hoisted(() => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useReadContracts: vi.fn(),
  STAKING: '0x0000000000000000000000000000000000000001',
}))

vi.mock('wagmi', () => ({ useAccount, useReadContract, useReadContracts }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))
vi.mock('@/config/contracts', () => ({
  getContractAddresses: () => ({
    staking: STAKING,
    token: '0x0000000000000000000000000000000000000002',
  }),
}))

const CHAIN_ID = 11155111
const OTHER_VALIDATOR = '0x2222222222222222222222222222222222222222'

function lastRead() {
  return useReadContract.mock.calls.at(-1)?.[0]
}

function lastReads() {
  return useReadContracts.mock.calls.at(-1)?.[0]
}

describe('staking reads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccount.mockReturnValue(stubConnectedAccount())
    useReadContract.mockReturnValue(stubRead(1n))
    useReadContracts.mockReturnValue({ data: [] })
  })

  it('polls the withdraw delay regardless of connection', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    const { result } = renderHook(() => useWithdrawDelay())

    expect(result.current).toBe(useReadContract.mock.results.at(-1)?.value)
    expect(lastRead()).toEqual({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'withdrawDelay',
      chainId: CHAIN_ID,
      query: { refetchInterval: 30_000 },
    })
  })

  it('reads the connected account total stake', () => {
    renderHook(() => useUserTotalStake())

    expect(lastRead()).toEqual({
      address: STAKING,
      abi: stakingAbi,
      functionName: 'totalStakerStakes',
      args: [TEST_ACCOUNT],
      chainId: CHAIN_ID,
      query: { enabled: true, refetchInterval: 30_000 },
    })
  })

  it('reads the connected account stake on one validator', () => {
    renderHook(() => useUserStakeOnValidator(TEST_VALIDATOR))

    expect(lastRead()).toMatchObject({
      functionName: 'stakes',
      args: [TEST_ACCOUNT, TEST_VALIDATOR],
      query: { enabled: true },
    })
  })

  it.each([
    ['useUserTotalStake', () => useUserTotalStake()],
    ['useUserStakeOnValidator', () => useUserStakeOnValidator(TEST_VALIDATOR)],
  ])('%s does not read without a connected account', (_name, hook) => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    renderHook(hook)

    expect(lastRead()).toMatchObject({ args: undefined, query: { enabled: false } })
  })

  it('batches the account stake for each validator', () => {
    renderHook(() => useUserStakesOnValidators([TEST_VALIDATOR, OTHER_VALIDATOR]))

    const options = lastReads()
    expect(options.contracts).toEqual([
      {
        address: STAKING,
        abi: stakingAbi,
        functionName: 'stakes',
        args: [TEST_ACCOUNT, TEST_VALIDATOR],
        chainId: CHAIN_ID,
      },
      {
        address: STAKING,
        abi: stakingAbi,
        functionName: 'stakes',
        args: [TEST_ACCOUNT, OTHER_VALIDATOR],
        chainId: CHAIN_ID,
      },
    ])
    expect(options.query).toEqual({ enabled: true, refetchInterval: 30_000 })
  })

  it('disables the account stake batch without an account or validators', () => {
    renderHook(() => useUserStakesOnValidators([]))
    expect(lastReads().query.enabled).toBe(false)

    useAccount.mockReturnValue(stubDisconnectedAccount())
    renderHook(() => useUserStakesOnValidators([TEST_VALIDATOR]))
    expect(lastReads().query.enabled).toBe(false)
    expect(lastReads().contracts[0].args).toBeUndefined()
  })

  it('batches validator totals without needing an account', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    renderHook(() => useValidatorTotalStakes([TEST_VALIDATOR]))

    expect(lastReads()).toEqual({
      contracts: [
        {
          address: STAKING,
          abi: stakingAbi,
          functionName: 'totalValidatorStakes',
          args: [TEST_VALIDATOR],
          chainId: CHAIN_ID,
        },
      ],
      query: { enabled: true, refetchInterval: 30_000 },
    })
  })

  it('disables validator totals for an empty list', () => {
    renderHook(() => useValidatorTotalStakes([]))

    expect(lastReads().query.enabled).toBe(false)
  })
})
