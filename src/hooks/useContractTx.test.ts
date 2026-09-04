import { renderHook } from '@testing-library/react'
import { UserRejectedRequestError, encodeFunctionData } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { erc20Abi } from '@/abi/erc20Abi'

import {
  SAFE_TX_FAILED_ERROR,
  TX_REJECTED_TOAST,
  useBatchContractTx,
  useContractTx,
} from './useContractTx'

const {
  toastInfo,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendCalls,
  useCallsStatus,
  useCapabilities,
  invalidateQueries,
} = vi.hoisted(() => ({
  toastInfo: vi.fn(),
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useSendCalls: vi.fn(),
  useCallsStatus: vi.fn(),
  useCapabilities: vi.fn(),
  invalidateQueries: vi.fn(),
}))

vi.mock('wagmi', () => ({
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendCalls,
  useCallsStatus,
  useCapabilities,
}))
vi.mock('@/config/queryClient', () => ({ queryClient: { invalidateQueries } }))
vi.mock('sonner', () => ({ toast: { info: toastInfo } }))
vi.mock('@/config/chains', () => ({ chain: { id: 11155111 } }))

const CHAIN_ID = 11155111
const TX_HASH = '0xabc'
const TOKEN = '0x0000000000000000000000000000000000000002'
const SPENDER = '0x0000000000000000000000000000000000000001'
const INVALIDATION = { functionNames: ['stakes'], extraKeys: [['validators']] }

const writeContract = vi.fn()
const sendCalls = vi.fn()

function mockConnector(type: 'injected' | 'safe' | undefined) {
  useAccount.mockReturnValue({ connector: type ? { type } : undefined })
}

function mockWrite(overrides: Record<string, unknown> = {}) {
  useWriteContract.mockReturnValue({
    writeContract,
    data: undefined,
    isPending: false,
    isSuccess: false,
    reset: vi.fn(),
    error: null,
    ...overrides,
  })
}

function mockReceipt(overrides: Record<string, unknown> = {}) {
  useWaitForTransactionReceipt.mockReturnValue({
    isLoading: false,
    isSuccess: false,
    error: null,
    ...overrides,
  })
}

const DEFAULT_STATUS_CODE = { pending: 100, success: 200, failure: 500 } as const

function mockCalls({
  batchId,
  status,
  statusCode,
  isPending = false,
  error = null,
}: {
  batchId?: string
  status?: 'pending' | 'success' | 'failure'
  statusCode?: number
  isPending?: boolean
  error?: Error | null
} = {}) {
  useSendCalls.mockReturnValue({
    sendCalls,
    data: batchId ? { id: batchId } : undefined,
    isPending,
    error,
    reset: vi.fn(),
  })
  useCallsStatus.mockReturnValue({
    data: status
      ? {
          status,
          statusCode: statusCode ?? DEFAULT_STATUS_CODE[status],
          receipts: status === 'success' ? [{ transactionHash: TX_HASH }] : [],
        }
      : undefined,
  })
}

function predicateMatches(queryKey: unknown[]) {
  const call = invalidateQueries.mock.calls.find(([arg]) => typeof arg?.predicate === 'function')
  return call?.[0].predicate({ queryKey }) as boolean
}

const APPROVE = {
  address: TOKEN,
  abi: erc20Abi,
  functionName: 'approve',
  args: [SPENDER, 5n],
} as const

describe('useContractTx with a regular wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnector('injected')
    mockWrite()
    mockReceipt()
    mockCalls()
  })

  it('writes directly on the configured chain', () => {
    const { result } = renderHook(() => useContractTx(INVALIDATION))

    result.current.write(APPROVE)

    expect(sendCalls).not.toHaveBeenCalled()
    expect(writeContract).toHaveBeenCalledWith({ chainId: CHAIN_ID, ...APPROVE })
  })

  it('reports signing while the wallet prompt is open', () => {
    mockWrite({ isPending: true })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSigningTx).toBe(true)
    expect(result.current.isConfirmingTx).toBe(false)
    expect(result.current.isSafeQueued).toBe(false)
  })

  it('reports confirming once the hash is known and never marks it Safe-queued', () => {
    mockWrite({ data: TX_HASH, isSuccess: true })
    mockReceipt({ isLoading: true })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.txHash).toBe(TX_HASH)
    expect(result.current.isConfirmingTx).toBe(true)
    expect(result.current.isSafeQueued).toBe(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('prefers the write error over the receipt error', () => {
    const writeError = new Error('rejected')
    mockWrite({ error: writeError })
    mockReceipt({ error: new Error('receipt') })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.error).toBe(writeError)
  })

  it('hides a wallet rejection from the error and shows a neutral toast once', () => {
    mockWrite({ error: new UserRejectedRequestError(new Error('denied')) })

    const { result, rerender } = renderHook(() => useContractTx(INVALIDATION))
    rerender()

    expect(result.current.error).toBeNull()
    expect(result.current.isRejected).toBe(true)
    expect(toastInfo).toHaveBeenCalledTimes(1)
    expect(toastInfo).toHaveBeenCalledWith(TX_REJECTED_TOAST.title, {
      description: TX_REJECTED_TOAST.description,
    })
  })

  it('keeps real failures as errors without the rejection toast', () => {
    const failure = new Error('execution reverted')
    mockWrite({ error: failure })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.error).toBe(failure)
    expect(result.current.isRejected).toBe(false)
    expect(toastInfo).not.toHaveBeenCalled()
  })

  it('invalidates matching reads, simulations and extra keys on success', () => {
    mockWrite({ data: TX_HASH, isSuccess: true })
    mockReceipt({ isSuccess: true })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSuccess).toBe(true)
    expect(predicateMatches(['simulateContract', { functionName: 'anything' }])).toBe(true)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['validators'] })
    expect(predicateMatches(['readContract', { functionName: 'stakes' }])).toBe(true)
    expect(predicateMatches(['readContract', { functionName: 'balanceOf' }])).toBe(false)
    expect(
      predicateMatches(['readContracts', { contracts: [{ functionName: 'stakes' }] }]),
    ).toBe(true)
    expect(predicateMatches(['validators'])).toBe(false)
  })

  it('works without extra keys', () => {
    mockWrite({ data: TX_HASH, isSuccess: true })
    mockReceipt({ isSuccess: true })

    renderHook(() => useContractTx({ functionNames: ['allowance'] }))

    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(predicateMatches(['readContract', { functionName: 'allowance' }])).toBe(true)
  })

  it('ignores Safe call status when not connected through Safe', () => {
    mockCalls({ batchId: 'safe-tx', status: 'success' })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSuccess).toBe(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})

describe('useContractTx inside a Safe App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnector('safe')
    mockWrite()
    mockReceipt()
    mockCalls()
  })

  it('routes the write through sendCalls as encoded calldata', () => {
    const { result } = renderHook(() => useContractTx(INVALIDATION))

    result.current.write(APPROVE)

    expect(writeContract).not.toHaveBeenCalled()
    expect(sendCalls).toHaveBeenCalledWith({
      chainId: CHAIN_ID,
      calls: [
        {
          to: TOKEN,
          data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [SPENDER, 5n] }),
        },
      ],
    })
  })

  it('forwards a native value when provided', () => {
    const { result } = renderHook(() => useContractTx(INVALIDATION))

    result.current.write({ ...APPROVE, value: 7n })

    expect(sendCalls.mock.calls[0]?.[0].calls[0].value).toBe(7n)
  })

  it('reports signing while the Safe prompt is open', () => {
    mockCalls({ isPending: true })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSigningTx).toBe(true)
    expect(result.current.isSafeQueued).toBe(false)
  })

  it('reports queued while Safe has not executed the transaction', () => {
    mockCalls({ batchId: 'safe-tx', status: 'pending' })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSafeQueued).toBe(true)
    expect(result.current.isConfirmingTx).toBe(true)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.txHash).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('resolves to success with the on-chain hash once Safe executes', () => {
    mockCalls({ batchId: 'safe-tx', status: 'success' })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSafeQueued).toBe(false)
    expect(result.current.isConfirmingTx).toBe(false)
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.txHash).toBe(TX_HASH)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['validators'] })
  })

  it('surfaces a failed Safe transaction as an error', () => {
    mockCalls({ batchId: 'safe-tx', status: 'failure' })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSafeQueued).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isRejected).toBe(false)
    expect(result.current.error).toBe(SAFE_TX_FAILED_ERROR)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('treats a transaction cancelled in the Safe queue as a rejection', () => {
    mockCalls({ batchId: 'safe-tx', status: 'failure', statusCode: 400 })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSafeQueued).toBe(false)
    expect(result.current.isRejected).toBe(true)
    expect(result.current.error).toBeNull()
    expect(toastInfo).toHaveBeenCalledTimes(1)
  })

  it('treats a rejection inside the Safe prompt as cancelled, not failed', () => {
    mockCalls({ error: new Error('Transaction was rejected') })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.error).toBeNull()
    expect(result.current.isRejected).toBe(true)
    expect(toastInfo).toHaveBeenCalledTimes(1)
  })

  it('prefers the sendCalls error over the failed status', () => {
    const sendError = new Error('rejected')
    mockCalls({ batchId: 'safe-tx', status: 'failure', error: sendError })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.error).toBe(sendError)
  })

  it('ignores direct receipt state', () => {
    mockWrite({ data: TX_HASH, isSuccess: true })
    mockReceipt({ isSuccess: true })

    const { result } = renderHook(() => useContractTx(INVALIDATION))

    expect(result.current.isSuccess).toBe(false)
    expect(result.current.txHash).toBeUndefined()
  })
})

describe('call status polling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockConnector('safe')
    mockWrite()
    mockReceipt()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function refetchInterval(status: 'pending' | 'success' | 'failure' | undefined) {
    const options = useCallsStatus.mock.calls.at(-1)?.[0]
    return options.query.refetchInterval({ state: { data: status ? { status } : undefined } })
  }

  it('does not poll before a call id exists', () => {
    mockCalls()

    renderHook(() => useContractTx(INVALIDATION))

    expect(useCallsStatus.mock.calls.at(-1)?.[0].query.enabled).toBe(false)
  })

  it('backs off while the Safe transaction stays queued', () => {
    mockCalls({ batchId: 'safe-tx', status: 'pending' })

    const { rerender } = renderHook(() => useContractTx(INVALIDATION))

    expect(refetchInterval('pending')).toBe(2_000)
    expect(refetchInterval(undefined)).toBe(2_000)

    vi.advanceTimersByTime(60_000)
    rerender()
    expect(refetchInterval('pending')).toBe(5_000)

    vi.advanceTimersByTime(4 * 60_000)
    rerender()
    expect(refetchInterval('pending')).toBe(10_000)
  })

  it('stops polling once the status settles', () => {
    mockCalls({ batchId: 'safe-tx', status: 'pending' })

    renderHook(() => useContractTx(INVALIDATION))

    expect(refetchInterval('success')).toBe(false)
    expect(refetchInterval('failure')).toBe(false)
  })

  it('restarts the schedule for a new submission', () => {
    mockCalls({ batchId: 'first', status: 'pending' })

    const { rerender } = renderHook(() => useContractTx(INVALIDATION))
    expect(refetchInterval('pending')).toBe(2_000)
    vi.advanceTimersByTime(2 * 60_000)
    rerender()
    expect(refetchInterval('pending')).toBe(5_000)

    mockCalls({ batchId: 'second', status: 'pending' })
    rerender()
    expect(refetchInterval('pending')).toBe(2_000)
  })
})

describe('useBatchContractTx', () => {
  function mockBatch({
    capabilities = { [CHAIN_ID]: { atomicBatch: { supported: true } } },
    capabilitiesError = false,
    ...calls
  }: Parameters<typeof mockCalls>[0] & { capabilities?: unknown; capabilitiesError?: boolean } = {}) {
    useCapabilities.mockReturnValue({ data: capabilities, isError: capabilitiesError })
    mockCalls(calls)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockConnector('injected')
    mockBatch()
  })

  it('reports batching support from wallet capabilities', () => {
    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.supportsBatching).toBe(true)
  })

  it('treats a capabilities error as no batching support', () => {
    mockBatch({ capabilitiesError: true })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.supportsBatching).toBe(false)
  })

  it('sends calls on the configured chain', () => {
    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))
    const calls = [{ to: SPENDER, data: '0x' }] as const

    result.current.sendCalls(calls)

    expect(sendCalls).toHaveBeenCalledWith({ chainId: CHAIN_ID, calls })
  })

  it('reports confirming until the batch status settles', () => {
    mockBatch({ batchId: 'batch', status: 'pending' })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.isConfirmingTx).toBe(true)
    expect(result.current.isSafeQueued).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isReverted).toBe(false)
  })

  it('marks a pending batch as Safe-queued when connected through Safe', () => {
    mockConnector('safe')
    mockBatch({ batchId: 'batch', status: 'pending' })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.isSafeQueued).toBe(true)
  })

  it('exposes the receipt hash and invalidates on success', () => {
    mockBatch({ batchId: 'batch', status: 'success' })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.isConfirmingTx).toBe(false)
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.txHash).toBe(TX_HASH)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['validators'] })
  })

  it('hides a wallet rejection of the batch prompt', () => {
    mockBatch({ error: Object.assign(new Error('rejected'), { code: 4001 }) })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.error).toBeNull()
    expect(result.current.isRejected).toBe(true)
    expect(toastInfo).toHaveBeenCalledTimes(1)
  })

  it('reports a reverted batch without invalidating', () => {
    mockBatch({ batchId: 'batch', status: 'failure' })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.isReverted).toBe(true)
    expect(result.current.isRejected).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('reports a batch cancelled in the Safe queue as rejected, not reverted', () => {
    mockConnector('safe')
    mockBatch({ batchId: 'batch', status: 'failure', statusCode: 400 })

    const { result } = renderHook(() => useBatchContractTx(INVALIDATION))

    expect(result.current.isReverted).toBe(false)
    expect(result.current.isRejected).toBe(true)
    expect(result.current.isConfirmingTx).toBe(false)
  })
})
