import { act, renderHook } from '@testing-library/react'
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  HttpRequestError,
} from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { erc20Abi } from '@/abi/erc20Abi'

import { TX_SIMULATION_DEBOUNCE_MS, useTxSimulation } from './useTxSimulation'

const { useSimulateContract } = vi.hoisted(() => ({ useSimulateContract: vi.fn() }))

vi.mock('wagmi', () => ({ useSimulateContract }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))

const TOKEN = '0x0000000000000000000000000000000000000002'
const SPENDER = '0x0000000000000000000000000000000000000001'

function params(amount: bigint) {
  return { address: TOKEN, abi: erc20Abi, functionName: 'approve', args: [SPENDER, amount] } as const
}

function mockQuery(state: Partial<{
  isPending: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
}>) {
  useSimulateContract.mockReturnValue({
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    ...state,
  })
}

function lastQueryArgs() {
  return useSimulateContract.mock.calls.at(-1)?.[0]
}

describe('useTxSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockQuery({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is idle and disables the query when there is nothing to simulate', () => {
    const { result } = renderHook(() => useTxSimulation(undefined))

    expect(result.current).toEqual({ status: 'idle' })
    expect(lastQueryArgs().query.enabled).toBe(false)
  })

  it('is idle and disables the query when not enabled', () => {
    const { result } = renderHook(() => useTxSimulation(params(1n), false))

    expect(result.current).toEqual({ status: 'idle' })
    expect(lastQueryArgs().query.enabled).toBe(false)
  })

  it('passes the initial params to the query immediately', () => {
    renderHook(() => useTxSimulation(params(1n)))

    const args = lastQueryArgs()
    expect(args.query.enabled).toBe(true)
    expect(args.chainId).toBe(11155111)
    expect(args.address).toBe(TOKEN)
    expect(args.functionName).toBe('approve')
    expect(args.args).toEqual([SPENDER, 1n])
  })

  it('reports ok when the simulation succeeds', () => {
    const { result } = renderHook(() => useTxSimulation(params(1n)))

    expect(result.current).toEqual({ status: 'ok' })
  })

  it('reports checking while the query is loading', () => {
    mockQuery({ isPending: true })

    const { result } = renderHook(() => useTxSimulation(params(1n)))

    expect(result.current).toEqual({ status: 'checking' })
  })

  it('debounces argument changes and reports checking meanwhile', () => {
    const { result, rerender } = renderHook(({ amount }: { amount: bigint }) =>
      useTxSimulation(params(amount)),
    { initialProps: { amount: 1n } })

    rerender({ amount: 2n })

    expect(result.current).toEqual({ status: 'checking' })
    expect(lastQueryArgs().args).toEqual([SPENDER, 1n])

    rerender({ amount: 3n })
    act(() => {
      vi.advanceTimersByTime(TX_SIMULATION_DEBOUNCE_MS - 1)
    })
    expect(lastQueryArgs().args).toEqual([SPENDER, 1n])

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(lastQueryArgs().args).toEqual([SPENDER, 3n])
    expect(result.current).toEqual({ status: 'ok' })
  })

  it('reports a revert with its reason', () => {
    const reverted = new ContractFunctionRevertedError({
      abi: [],
      functionName: 'approve',
      message: 'execution reverted: Paused',
    })
    mockQuery({
      isError: true,
      error: new ContractFunctionExecutionError(reverted, { abi: [], functionName: 'approve' }),
    })

    const { result } = renderHook(() => useTxSimulation(params(1n)))

    expect(result.current).toEqual({ status: 'failed', reason: 'execution reverted: Paused' })
  })

  it('reports unavailable when the node cannot be reached', () => {
    mockQuery({
      isError: true,
      error: new HttpRequestError({ url: 'https://rpc', details: 'timeout' }),
    })

    const { result } = renderHook(() => useTxSimulation(params(1n)))

    expect(result.current).toEqual({ status: 'unavailable' })
  })
})
