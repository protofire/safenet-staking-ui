export type SupportedChainId = '1' | '11155111'

export const RPC_FALLBACKS = {
  '11155111': [
    'https://public.1rpc.io/sepolia',
    'https://0xrpc.io/sep',
    'https://eth-sepolia.api.onfinality.io/public',
    'https://ethereum-sepolia-public.nodies.app',
    'https://eth-sepolia-testnet.api.pocket.network',
  ],
  '1': [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.drpc.org',
    'https://public.1rpc.io/eth',
    'https://0xrpc.io/eth',
  ],
} as const satisfies Record<SupportedChainId, readonly string[]>

function isHttpUrl(value: string): value is `https://${string}` {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function buildRpcUrls(
  primary: string,
  chainId: SupportedChainId,
): `https://${string}`[] {
  const urls: `https://${string}`[] = []
  const seen = new Set<string>()

  for (const candidate of [primary, ...RPC_FALLBACKS[chainId]]) {
    if (!isHttpUrl(candidate) || seen.has(candidate)) continue
    seen.add(candidate)
    urls.push(candidate)
  }

  return urls
}

export function getRpcConnectOrigins(chainId: SupportedChainId, primary: string): string[] {
  const origins = new Set<string>()
  for (const url of buildRpcUrls(primary, chainId)) {
    origins.add(new URL(url).origin)
  }
  return [...origins]
}
