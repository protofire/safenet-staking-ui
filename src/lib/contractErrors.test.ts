import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
  HttpRequestError,
  UserRejectedRequestError,
} from 'viem'
import { describe, expect, it } from 'vitest'

import { classifySimulationError, formatContractError, isUserRejection } from './contractErrors'

describe('formatContractError', () => {
  it('prefers viem shortMessage', () => {
    const error = Object.assign(new Error('long details'), {
      shortMessage: 'User rejected the request.',
    })
    expect(formatContractError(error)).toBe('User rejected the request.')
  })

  it('falls back to Error message', () => {
    expect(formatContractError(new Error('boom'))).toBe('boom')
  })

  it('returns string errors as-is', () => {
    expect(formatContractError('plain')).toBe('plain')
  })

  it('returns a generic message for unknown shapes', () => {
    expect(formatContractError(undefined)).toBe('Unknown error')
    expect(formatContractError({ shortMessage: 42 })).toBe('Unknown error')
  })
})

describe('isUserRejection', () => {
  it('detects viem UserRejectedRequestError anywhere in the cause chain', () => {
    const inner = new UserRejectedRequestError(new Error('denied'))
    const wrapped = new ContractFunctionExecutionError(inner, {
      abi: [],
      functionName: 'stake',
    })
    expect(isUserRejection(inner)).toBe(true)
    expect(isUserRejection(wrapped)).toBe(true)
  })

  it('detects EIP-1193 and ethers rejection codes', () => {
    expect(isUserRejection(Object.assign(new Error('x'), { code: 4001 }))).toBe(true)
    expect(isUserRejection(Object.assign(new Error('x'), { code: 'ACTION_REJECTED' }))).toBe(true)
  })

  it('detects rejection messages from Safe and WalletConnect', () => {
    expect(isUserRejection(new Error('Transaction was rejected'))).toBe(true)
    expect(isUserRejection(new Error('User rejected methods.'))).toBe(true)
    expect(
      isUserRejection(new Error('MetaMask Tx Signature: User denied transaction signature.')),
    ).toBe(true)
  })

  it('does not flag other failures', () => {
    expect(isUserRejection(null)).toBe(false)
    expect(isUserRejection(new Error('execution reverted'))).toBe(false)
    expect(isUserRejection(new Error('insufficient funds for gas'))).toBe(false)
  })

  it('survives circular cause chains', () => {
    const a = new Error('a') as Error & { cause?: unknown }
    const b = new Error('b') as Error & { cause?: unknown }
    a.cause = b
    b.cause = a
    expect(isUserRejection(a)).toBe(false)
  })
})

describe('classifySimulationError', () => {
  it('classifies a decoded revert with its reason', () => {
    const reverted = new ContractFunctionRevertedError({
      abi: [],
      functionName: 'stake',
      message: 'execution reverted: Insufficient allowance',
    })
    const wrapped = new ContractFunctionExecutionError(reverted, { abi: [], functionName: 'stake' })
    expect(classifySimulationError(wrapped)).toEqual({
      kind: 'revert',
      reason: 'execution reverted: Insufficient allowance',
    })
  })

  it('classifies a raw execution revert without a reason', () => {
    const error = new ContractFunctionExecutionError(new ExecutionRevertedError({}), {
      abi: [],
      functionName: 'stake',
    })
    expect(classifySimulationError(error)).toEqual({ kind: 'revert', reason: undefined })
  })

  it('treats transport and unknown errors as unavailable', () => {
    const http = new HttpRequestError({ url: 'https://rpc', details: 'timeout' })
    expect(classifySimulationError(http)).toEqual({ kind: 'unavailable' })
    expect(classifySimulationError(new Error('boom'))).toEqual({ kind: 'unavailable' })
    expect(classifySimulationError(undefined)).toEqual({ kind: 'unavailable' })
  })
})
