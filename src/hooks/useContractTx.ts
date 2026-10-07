import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  encodeFunctionData,
  type Abi,
  type Address,
  type ContractFunctionName,
  type EncodeFunctionDataParameters,
  type Hex,
} from 'viem'
import {
  useAccount,
  useCallsStatus,
  useCapabilities,
  useSendCalls,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { chain } from '@/config/chains'
import { isUserRejection } from '@/lib/contractErrors'
import { queryClient } from '@/lib/queryClient'
import { callsPollInterval } from '@/lib/txPolling'

export type TxInvalidation = {
  functionNames: readonly string[]
  extraKeys?: readonly (readonly unknown[])[]
}

export type BatchCall = {
  to: Address
  data: Hex
  value?: bigint
}

export type ContractWriteParams<
  abi extends Abi,
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
> = EncodeFunctionDataParameters<abi, functionName> & {
  address: Address
  value?: bigint
}

type LooseWriteParams = {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  value?: bigint
}

export const SAFE_TX_FAILED_ERROR = new Error('The transaction failed in Safe.')

const SAFE_CANCELLED_STATUS_CODE = 400

const NO_EXTRA_KEYS: readonly (readonly unknown[])[] = []

export function useInvalidateOnSuccess(
  isSuccess: boolean,
  functionNames: readonly string[],
  extraKeys: readonly (readonly unknown[])[] = NO_EXTRA_KEYS,
) {
  useEffect(() => {
    if (!isSuccess) return

    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey
        if (key[0] === 'readContract') {
          const opts = key[1] as Record<string, unknown> | undefined
          return functionNames.includes(opts?.functionName as string)
        }
        if (key[0] === 'readContracts') {
          const opts = key[1] as { contracts?: { functionName?: string }[] } | undefined
          return opts?.contracts?.some((c) => functionNames.includes(c.functionName ?? '')) ?? false
        }
        return key[0] === 'simulateContract'
      },
    })

    for (const key of extraKeys) {
      queryClient.invalidateQueries({ queryKey: [...key] })
    }
  }, [isSuccess, functionNames, extraKeys])
}

export const TX_REJECTED_TOAST = {
  title: 'Transaction cancelled',
  description: 'You rejected the request in your wallet. Nothing was sent.',
} as const

function useRejectionToast(isRejected: boolean) {
  const shownRef = useRef(false)

  useEffect(() => {
    if (!isRejected) {
      shownRef.current = false
      return
    }
    if (shownRef.current) return
    shownRef.current = true
    toast.info(TX_REJECTED_TOAST.title, { description: TX_REJECTED_TOAST.description })
  }, [isRejected])
}

export function useIsSafeConnector() {
  const { connector } = useAccount()
  return connector?.type === 'safe'
}

function useCallsTracker() {
  const { sendCalls: rawSendCalls, data: callsResult, isPending, error, reset } = useSendCalls()

  const batchId = callsResult?.id
  const pollStartRef = useRef<{ id: string; startedAt: number } | null>(null)

  const { data: callsStatus } = useCallsStatus({
    id: batchId ?? '',
    query: {
      enabled: !!batchId,
      refetchInterval: (query) => {
        const status = query.state.data?.status
        if (!batchId || status === 'success' || status === 'failure') return false
        const start =
          pollStartRef.current?.id === batchId
            ? pollStartRef.current
            : { id: batchId, startedAt: Date.now() }
        pollStartRef.current = start
        return callsPollInterval(Date.now() - start.startedAt)
      },
    },
  })

  const isSuccess = callsStatus?.status === 'success'
  const isFailure = callsStatus?.status === 'failure'
  const isCancelled = isFailure && callsStatus?.statusCode === SAFE_CANCELLED_STATUS_CODE
  const isReverted = isFailure && !isCancelled

  function sendCalls(calls: readonly BatchCall[]) {
    rawSendCalls({ chainId: chain.id, calls })
  }

  return {
    sendCalls,
    isSigning: isPending,
    isConfirming: !!batchId && !isSuccess && !isFailure,
    isSuccess,
    isReverted,
    isCancelled,
    error,
    reset,
    txHash: callsStatus?.receipts?.[0]?.transactionHash,
  }
}

export function useContractTx(invalidation: TxInvalidation) {
  const isSafe = useIsSafeConnector()

  const {
    writeContract,
    data: directTxHash,
    isPending: isDirectSigning,
    reset: resetDirect,
    error: writeError,
  } = useWriteContract()
  const {
    isLoading: isDirectConfirming,
    isSuccess: isDirectSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: directTxHash, chainId: chain.id })

  const safeTx = useCallsTracker()

  const isSuccess = isSafe ? safeTx.isSuccess : isDirectSuccess

  useInvalidateOnSuccess(isSuccess, invalidation.functionNames, invalidation.extraKeys)

  function write<
    const abi extends Abi,
    functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  >(params: ContractWriteParams<abi, functionName>) {
    const { address, abi, functionName, args, value } = params as LooseWriteParams
    if (isSafe) {
      safeTx.sendCalls([
        {
          to: address,
          data: encodeFunctionData({ abi, functionName, args }),
          ...(value === undefined ? {} : { value }),
        },
      ])
      return
    }
    writeContract({
      chainId: chain.id,
      address,
      abi,
      functionName,
      args,
      ...(value === undefined ? {} : { value }),
    })
  }

  function reset() {
    resetDirect()
    safeTx.reset()
  }

  const rawError = isSafe
    ? (safeTx.error ?? (safeTx.isReverted ? SAFE_TX_FAILED_ERROR : null))
    : (writeError ?? receiptError)
  const isRejected = isUserRejection(rawError) || (isSafe && safeTx.isCancelled)
  const error = isRejected ? null : rawError

  useRejectionToast(isRejected)

  if (isSafe) {
    return {
      write,
      isSigningTx: safeTx.isSigning,
      isConfirmingTx: safeTx.isConfirming,
      isSuccess,
      isSafeQueued: safeTx.isConfirming,
      isRejected,
      error,
      reset,
      txHash: safeTx.txHash,
    }
  }

  return {
    write,
    isSigningTx: isDirectSigning,
    isConfirmingTx: isDirectConfirming,
    isSuccess,
    isSafeQueued: false,
    isRejected,
    error,
    reset,
    txHash: directTxHash,
  }
}

export function useBatchContractTx(invalidation: TxInvalidation) {
  const isSafe = useIsSafeConnector()
  const { data: capabilities, isError: capabilitiesError } = useCapabilities({
    query: { retry: false },
  })

  const supportsBatching =
    !capabilitiesError && capabilities?.[chain.id]?.atomicBatch?.supported === true

  const tx = useCallsTracker()

  useInvalidateOnSuccess(tx.isSuccess, invalidation.functionNames, invalidation.extraKeys)

  const isRejected = isUserRejection(tx.error) || tx.isCancelled
  useRejectionToast(isRejected)

  return {
    sendCalls: tx.sendCalls,
    supportsBatching,
    isSigningTx: tx.isSigning,
    isConfirmingTx: tx.isConfirming,
    isSuccess: tx.isSuccess,
    isSafeQueued: isSafe && tx.isConfirming,
    isReverted: tx.isReverted,
    isRejected,
    error: isRejected ? null : tx.error,
    reset: tx.reset,
    txHash: tx.txHash,
  }
}
