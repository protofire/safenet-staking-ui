import { useQuery } from '@tanstack/react-query'
import { getAddress } from 'viem'
import type { Address, Hex } from 'viem'

import { env } from '@/config/env'

export interface RewardProof {
  cumulativeAmount: string
  merkleRoot: Hex
  proof: Hex[] | null
  kycAmount?: string
  kyc?: boolean
}

class RewardProofFetchError extends Error {
  constructor(message = 'Failed to fetch reward proof') {
    super(message)
    this.name = 'RewardProofFetchError'
  }
}

function isValidProof(data: unknown): data is RewardProof {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (typeof obj.cumulativeAmount !== 'string') return false
  if (typeof obj.merkleRoot !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(obj.merkleRoot))
    return false
  if (
    obj.proof !== null &&
    !(
      Array.isArray(obj.proof) &&
      obj.proof.every((p) => typeof p === 'string' && /^0x[0-9a-fA-F]{64}$/.test(p as string))
    )
  )
    return false
  if (
    obj.kycAmount !== undefined &&
    (typeof obj.kycAmount !== 'string' || !/^\d+$/.test(obj.kycAmount))
  )
    return false
  if (obj.kyc !== undefined && typeof obj.kyc !== 'boolean') return false
  return true
}

function radixProofPath(addr: string): string {
  const hex = addr.slice(2, 10).toLowerCase()
  return `${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex.slice(6, 8)}`
}

function rewardsProofBaseUrl(): string {
  const raw = env.VITE_REWARDS_BASE_URL?.trim() ?? ''
  if (raw.length === 0) throw new RewardProofFetchError('VITE_REWARDS_BASE_URL is not configured')
  return raw.replace(/\/$/, '')
}

async function fetchProof(address: Address): Promise<RewardProof | null> {
  const normalized = getAddress(address)
  const lower = normalized.toLowerCase()
  const baseUrl = rewardsProofBaseUrl()
  const url = `${baseUrl}/proofs/${radixProofPath(lower)}/${lower}.json`
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new RewardProofFetchError()
  }
  if (response.status === 404) return null
  if (!response.ok) throw new RewardProofFetchError()
  const text = await response.text()
  const trimmed = text.trimStart()
  if (trimmed.length === 0) return null
  if (trimmed.startsWith('<')) return null
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new RewardProofFetchError()
  }
  if (!isValidProof(json)) throw new RewardProofFetchError()
  return json
}

export function useRewardProof(address: Address | undefined, enabled = true) {
  return useQuery({
    queryKey: ['rewardProof', address],
    queryFn: () => fetchProof(address!),
    enabled: !!address && enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
