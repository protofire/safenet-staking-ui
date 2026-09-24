import { describe, expect, it } from 'vitest'

import { buildRpcUrls, getRpcConnectOrigins } from './rpcFallbacks'

describe('buildRpcUrls', () => {
  it('puts the primary URL first, followed by the chain fallbacks in order', () => {
    expect(buildRpcUrls('https://my-rpc.example.com', '11155111')).toEqual([
      'https://my-rpc.example.com',
      'https://public.1rpc.io/sepolia',
      'https://0xrpc.io/sep',
      'https://eth-sepolia.api.onfinality.io/public',
      'https://ethereum-sepolia-public.nodies.app',
      'https://eth-sepolia-testnet.api.pocket.network',
    ])
  })

  it('does not repeat a primary URL that is also a fallback', () => {
    const urls = buildRpcUrls('https://eth.drpc.org', '1')

    expect(urls[0]).toBe('https://eth.drpc.org')
    expect(urls.filter((url) => url === 'https://eth.drpc.org')).toHaveLength(1)
  })

  it.each(['not-a-url', 'http://insecure-rpc.example.com', ''])(
    'skips a non-https primary URL: %j',
    (primary) => {
      const urls = buildRpcUrls(primary, '1')

      expect(urls).not.toContain(primary)
      expect(urls[0]).toBe('https://ethereum-rpc.publicnode.com')
    },
  )
})

describe('getRpcConnectOrigins', () => {
  it('collapses URLs that share an origin', () => {
    expect(getRpcConnectOrigins('1', 'https://public.1rpc.io/custom')).toEqual([
      'https://public.1rpc.io',
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
      'https://0xrpc.io',
    ])
  })
})
