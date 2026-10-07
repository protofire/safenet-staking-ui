import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useBlock } from 'wagmi'

import { chain } from '@/config/chains'
import { useUserStakesOnValidators, useUserTotalStake } from '@/hooks/useStakingReads'
import { useValidators } from '@/hooks/useValidators'
import { useUserPendingWithdrawals } from '@/hooks/useWithdrawals'
import { buildPositions, countCoolingDown, sumPendingWei } from '@/lib/portfolio'

export function usePortfolioPositions(isConnected: boolean) {
  const { resolvedTheme } = useTheme()
  const chartTheme = resolvedTheme === 'light' ? 'light' : 'dark'
  const { data: block } = useBlock({ chainId: chain.id, watch: true })

  const validatorsQuery = useValidators()
  const { data: validators } = validatorsQuery
  const validatorAddresses = useMemo(() => validators?.map((v) => v.address) ?? [], [validators])

  const { data: stakeReads, isPending: stakesPending } =
    useUserStakesOnValidators(validatorAddresses)
  const { data: totalStakeWei, isPending: totalStakePending } = useUserTotalStake()
  const { data: rawPendingWithdrawals, isPending: withdrawalsPending } = useUserPendingWithdrawals()

  const pendingQueue = useMemo(
    () => rawPendingWithdrawals?.filter((w) => w.amount > 0n) ?? [],
    [rawPendingWithdrawals],
  )

  const positions = useMemo(
    () => buildPositions(validators, stakeReads, chartTheme),
    [validators, stakeReads, chartTheme],
  )

  const distributionTotal = useMemo(() => positions.reduce((s, p) => s + p.stake, 0n), [positions])

  const loading =
    !isConnected ||
    validatorsQuery.isPending ||
    stakesPending ||
    totalStakePending ||
    withdrawalsPending

  return {
    validatorsQuery,
    positions,
    distributionTotal,
    totalStakeWei,
    pendingTotalWei: sumPendingWei(pendingQueue),
    pendingCount: pendingQueue.length,
    pendingCooling: countCoolingDown(pendingQueue, block?.timestamp),
    loading,
    stakeOutsideRegistry:
      !loading &&
      totalStakeWei !== undefined &&
      totalStakeWei > 0n &&
      totalStakeWei > distributionTotal,
  }
}
