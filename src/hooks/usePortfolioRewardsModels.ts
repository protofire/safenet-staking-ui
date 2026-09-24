import { useMemo } from 'react'
import { useAccount } from 'wagmi'

import { getMerkleDropAddress } from '@/config/contracts'
import { useRewardProof } from '@/hooks/useRewardProof'
import { useRewards } from '@/hooks/useRewards'

export type PortfolioRewardsInfoNote = { kind: 'missing-config' } | { kind: 'proof-error' } | null

export function usePortfolioRewardsModels() {
  const { address } = useAccount()
  const merkleDrop = getMerkleDropAddress()
  const { data: rewards, isLoading: rewardsLoading } = useRewards()
  const {
    data: proof,
    isLoading: proofLoading,
    isError: proofError,
  } = useRewardProof(address, !!merkleDrop)

  const rewardsInfoNote = useMemo((): PortfolioRewardsInfoNote => {
    if (!merkleDrop) return { kind: 'missing-config' }
    if (proofError) return { kind: 'proof-error' }
    return null
  }, [merkleDrop, proofError])

  const loading = !!(merkleDrop && address && (rewardsLoading || proofLoading))

  return {
    merkleDrop,
    rewards,
    proof,
    rewardsInfoNote,
    loading,
    isError: proofError,
  }
}
