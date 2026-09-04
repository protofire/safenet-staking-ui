import { chain } from '@/config/chains'

function explorerBase(): string | undefined {
  return chain.blockExplorers?.default?.url
}

export function getExplorerAddressUrl(address: string): string | undefined {
  const base = explorerBase()
  if (!base) return undefined
  return `${base}/address/${address}`
}

export function getExplorerTxUrl(txHash: string): string | undefined {
  const base = explorerBase()
  if (!base) return undefined
  return `${base}/tx/${txHash}`
}
