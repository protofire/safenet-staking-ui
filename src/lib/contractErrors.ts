import {
  BaseError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
  UserRejectedRequestError,
} from 'viem'

export function formatContractError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'shortMessage' in error &&
    typeof (error as { shortMessage: unknown }).shortMessage === 'string'
  ) {
    return (error as { shortMessage: string }).shortMessage
  }
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

const REJECTION_MESSAGE = /user rejected|user denied|rejected the request|transaction was rejected/i

function isRejectionNode(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  if (node instanceof UserRejectedRequestError) return true
  const { code, message } = node as { code?: unknown; message?: unknown }
  if (code === 4001 || code === 'ACTION_REJECTED') return true
  return typeof message === 'string' && REJECTION_MESSAGE.test(message)
}

export function isUserRejection(error: unknown): boolean {
  let node: unknown = error
  const seen = new Set<unknown>()
  while (node && typeof node === 'object' && !seen.has(node)) {
    if (isRejectionNode(node)) return true
    seen.add(node)
    node = (node as { cause?: unknown }).cause
  }
  return false
}

export type SimulationVerdict =
  | { kind: 'revert'; reason: string | undefined }
  | { kind: 'unavailable' }

export function classifySimulationError(error: unknown): SimulationVerdict {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      return { kind: 'revert', reason: reverted.reason ?? reverted.data?.errorName }
    }
    if (error.walk((e) => e instanceof ExecutionRevertedError)) {
      return { kind: 'revert', reason: undefined }
    }
  }
  return { kind: 'unavailable' }
}
