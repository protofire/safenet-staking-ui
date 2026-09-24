import { describe, expect, it } from 'vitest'

import { buildRpcUrls, getRpcConnectOrigins, RPC_FALLBACKS } from './rpcFallbacks'

describe('buildRpcUrls', () => {
  it('puts the primary URL first and deduplicates config fallbacks', () => {
    const primary = 'https://ethereum-sepolia-rpc.publicnode.com'
    const urls = buildRpcUrls(primary, '11155111')

    expect(urls[0]).toBe(primary)
    expect(new Set(urls).size).toBe(urls.length)
    expect(urls.length).toBe(1 + RPC_FALLBACKS['11155111'].length)
  })

  it('skips invalid primary URLs and still includes config fallbacks', () => {
    const urls = buildRpcUrls('not-a-url', '11155111')

    expect(urls.every((url) => url.startsWith('https://'))).toBe(true)
    expect(urls.length).toBe(RPC_FALLBACKS['11155111'].length)
  })
})

describe('getRpcConnectOrigins', () => {
  it('returns unique origins for primary and config fallback RPC URLs', () => {
    const origins = getRpcConnectOrigins('11155111', 'https://ethereum-sepolia-rpc.publicnode.com')

    expect(origins).toContain('https://ethereum-sepolia-rpc.publicnode.com')
    expect(origins).toContain('https://public.1rpc.io')
    expect(new Set(origins).size).toBe(origins.length)
  })
})
