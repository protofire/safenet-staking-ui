import { mainnet, sepolia } from 'wagmi/chains'
import { describe, expect, it } from 'vitest'

import { chainsByEnvId } from './chains'

describe('chainsByEnvId', () => {
  it('maps chain id 1 to mainnet', () => {
    expect(chainsByEnvId['1']).toBe(mainnet)
  })

  it('maps chain id 11155111 to sepolia', () => {
    expect(chainsByEnvId['11155111']).toBe(sepolia)
  })
})
