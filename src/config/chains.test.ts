import { describe, expect, it } from 'vitest'
import { mainnet, sepolia } from 'wagmi/chains'

import { chainsByEnvId, getChainDisplayName } from './chains'

describe('chainsByEnvId', () => {
  it('maps chain id 1 to mainnet', () => {
    expect(chainsByEnvId['1']).toBe(mainnet)
  })

  it('maps chain id 11155111 to sepolia', () => {
    expect(chainsByEnvId['11155111']).toBe(sepolia)
  })
})

describe('getChainDisplayName', () => {
  it('maps the supported chain ids to their display names', () => {
    expect(getChainDisplayName(1)).toBe('Ethereum')
    expect(getChainDisplayName(11155111)).toBe('Sepolia')
  })

  it('falls back to a wrong-network label for any other chain', () => {
    expect(getChainDisplayName(137)).toBe('Wrong network')
  })

  it('reports an unknown chain when the wallet has not provided one', () => {
    expect(getChainDisplayName(undefined)).toBe('Unknown chain')
  })
})
