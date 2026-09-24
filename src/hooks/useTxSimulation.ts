import { useEffect, useRef, useState } from 'react'
import type { Abi, Address, ContractFunctionName } from 'viem'
import { useSimulateContract } from 'wagmi'

import type { ContractWriteParams } from './useContractTx'
import { chain } from '@/config/chains'
import { classifySimulationError } from '@/lib/contractErrors'

export const TX_SIMULATION_DEBOUNCE_MS = 400

export type TxSimulation =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok' }
  | { status: 'failed'; reason: string | undefined }
  | { status: 'unavailable' }

export const IDLE_SIMULATION: TxSimulation = { status: 'idle' }

type LooseParams = {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
}

function paramsKey(params: LooseParams | undefined): string {
  if (!params) return ''
  return JSON.stringify(
    [params.address, params.functionName, params.args ?? []],
    (_, v: unknown) => (typeof v === 'bigint' ? v.toString() : v),
  )
}

function useDebouncedParams(params: LooseParams | undefined, delayMs: number) {
  const key = paramsKey(params)
  const latest = useRef(params)
  const [debounced, setDebounced] = useState({ key, params })

  useEffect(() => {
    latest.current = params
  })

  useEffect(() => {
    if (debounced.key === key) return
    const timeoutId = setTimeout(() => setDebounced({ key, params: latest.current }), delayMs)
    return () => clearTimeout(timeoutId)
  }, [key, delayMs, debounced.key])

  return { params: debounced.params, settled: debounced.key === key }
}

export function useTxSimulation<
  const abi extends Abi,
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
>(params: ContractWriteParams<abi, functionName> | undefined, enabled = true): TxSimulation {
  const { params: debounced, settled } = useDebouncedParams(
    params as LooseParams | undefined,
    TX_SIMULATION_DEBOUNCE_MS,
  )
  const active = enabled && debounced !== undefined

  const query = useSimulateContract({
    chainId: chain.id,
    address: debounced?.address,
    abi: debounced?.abi,
    functionName: debounced?.functionName,
    args: debounced?.args,
    query: { enabled: active, retry: false, staleTime: 0, gcTime: 0 },
  })

  if (!enabled || params === undefined) return IDLE_SIMULATION
  if (!settled || query.isPending || query.isFetching) return { status: 'checking' }
  if (query.isError) {
    const verdict = classifySimulationError(query.error)
    return verdict.kind === 'revert'
      ? { status: 'failed', reason: verdict.reason }
      : { status: 'unavailable' }
  }
  return { status: 'ok' }
}
