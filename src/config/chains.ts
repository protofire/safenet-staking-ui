import { fallback, http, type Transport } from 'viem'
import { mainnet, sepolia, type Chain } from 'wagmi/chains'

import { env } from './env'
import { buildRpcUrls, type SupportedChainId } from './rpcFallbacks'

export const chainsByEnvId = {
  '1': mainnet,
  '11155111': sepolia,
} as const satisfies Record<SupportedChainId, Chain>

export const chain: Chain = chainsByEnvId[env.VITE_CHAIN_ID]

export function getChainDisplayName(chainId: number | undefined): string {
  if (chainId === undefined) return 'Unknown chain'
  const known = Object.values(chainsByEnvId).find((c) => c.id === chainId)
  return known?.name ?? 'Wrong network'
}

const httpTransportOptions = { batch: { wait: 50 } } as const

function createFallbackTransport(chainId: SupportedChainId, primary: string): Transport {
  const urls = buildRpcUrls(primary, chainId)
  return fallback(
    urls.map((url) => http(url, httpTransportOptions)),
    { rank: false, retryCount: 2 },
  )
}

const transport = createFallbackTransport(env.VITE_CHAIN_ID, env.VITE_RPC_URL)

const mainnetCompanionTransport = createFallbackTransport(
  '1',
  'https://ethereum-rpc.publicnode.com',
)

export const wagmiChains: readonly [Chain, ...Chain[]] =
  env.VITE_CHAIN_ID === '11155111' ? [chain, mainnet] : [chain]

export function getWagmiTransports(): Record<number, Transport> {
  if (env.VITE_CHAIN_ID === '11155111') {
    return {
      [sepolia.id]: transport,
      [mainnet.id]: mainnetCompanionTransport,
    }
  }
  return { [chain.id]: transport }
}
