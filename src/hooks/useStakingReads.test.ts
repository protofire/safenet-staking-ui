import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useUserStakeOnValidator,
  useUserStakesOnValidators,
  useUserTotalStake,
  useValidatorTotalStakes,
} from './useStakingReads'
import { TEST_VALIDATOR } from '@/test/fixtures'
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

  it.each([
    ['useUserTotalStake', () => useUserTotalStake()],
    ['useUserStakeOnValidator', () => useUserStakeOnValidator(TEST_VALIDATOR)],
  ])('%s does not read without a connected account', (_name, hook) => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    renderHook(hook)

    expect(lastRead()).toMatchObject({ args: undefined, query: { enabled: false } })
  })

  it('disables the account stake batch without an account or validators', () => {
    renderHook(() => useUserStakesOnValidators([]))
    expect(lastReads().query.enabled).toBe(false)

    useAccount.mockReturnValue(stubDisconnectedAccount())
    renderHook(() => useUserStakesOnValidators([TEST_VALIDATOR]))
    expect(lastReads().query.enabled).toBe(false)
    expect(lastReads().contracts[0].args).toBeUndefined()
  })

  it('disables validator totals for an empty list', () => {
    renderHook(() => useValidatorTotalStakes([]))

    expect(lastReads().query.enabled).toBe(false)
  })
})
