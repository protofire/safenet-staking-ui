import type { Address } from 'viem'

import { env } from './env'

const configuredChainId = Number(env.VITE_CHAIN_ID)

function assertConfiguredChain(chainId: number) {
  if (chainId !== configuredChainId) {
    throw new Error(`No staking contract address configured for chain ${chainId}`)
  }
}

export function getStakingContractAddress(chainId: number): `0x${string}` {
  assertConfiguredChain(chainId)
  return env.VITE_STAKING_CONTRACT_ADDRESS as `0x${string}`
}

export function getSafeTokenAddress(chainId: number): `0x${string}` {
  assertConfiguredChain(chainId)
  return env.VITE_SAFE_TOKEN_ADDRESS as `0x${string}`
}

export function getMerkleDropAddress(): Address | undefined {
  const s = env.VITE_MERKLE_DROP_ADDRESS.trim()
  return s === '' ? undefined : (s as Address)
}

export function getContractAddresses(chainId: number): {
  staking: Address
  token: Address
  merkleDrop?: Address
} {
  const merkleDrop = getMerkleDropAddress()
  return {
    staking: getStakingContractAddress(chainId),
    token: getSafeTokenAddress(chainId),
    ...(merkleDrop !== undefined ? { merkleDrop } : {}),
  }
}

export function getFaucetContractAddress(chainId: number): `0x${string}` | undefined {
  assertConfiguredChain(chainId)
  if (chainId !== 11155111) return undefined
  const s = env.VITE_FAUCET_CONTRACT_ADDRESS.trim()
  return s === '' ? undefined : (s as `0x${string}`)
}
