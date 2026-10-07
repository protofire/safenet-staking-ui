import { StatCard } from '@/components/home/StatCard'
import { StatSafeValue } from '@/components/portfolio/StatSafeValue'
import { InfoStatSkeletonRow } from '@/components/ui/states'
import type { usePortfolioRewardsModels } from '@/hooks/usePortfolioRewardsModels'

type PortfolioStatsProps = {
  loading: boolean
  totalStakeWei: bigint | undefined
  positionsCount: number
  stakeOutsideRegistry: boolean
  pendingTotalWei: bigint
  pendingCount: number
  pendingCooling: number | null
  rewardsUiEnabled: boolean
  rewardsModel: ReturnType<typeof usePortfolioRewardsModels>
}

function stakeHint(totalStakeWei: bigint | undefined, count: number, outsideRegistry: boolean) {
  if ((totalStakeWei ?? 0n) === 0n) return 'No active positions'
  if (outsideRegistry && count === 0) return 'Includes stake on validators not listed below'
  return count === 1 ? 'Across 1 validator' : `Across ${count} validators`
}

function pendingHint(count: number, cooling: number | null) {
  if (count === 0) return 'Nothing in queue'
  if (cooling === null) return `${count} in queue`
  return `${cooling} of ${count} cooling down`
}

function claimableHint({ proof, rewards }: PortfolioStatsProps['rewardsModel']) {
  if (rewards.rootStale) {
    return 'Merkle root on-chain does not match the rewards file — claim stays off until they match'
  }
  if (!proof) return 'No rewards allocated'
  return rewards.claimable === 0n ? 'Nothing to claim yet' : 'Tokens ready to be transferred'
}

export function PortfolioStats(props: PortfolioStatsProps) {
  const { rewardsUiEnabled, rewardsModel } = props

  if (props.loading) {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoStatSkeletonRow count={4} />
      </div>
    )
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        value={<StatSafeValue value={props.totalStakeWei} />}
        label="Your stake"
        hint={stakeHint(props.totalStakeWei, props.positionsCount, props.stakeOutsideRegistry)}
      />
      <StatCard
        value={<StatSafeValue value={props.pendingTotalWei} />}
        label="Pending withdrawals"
        hint={pendingHint(props.pendingCount, props.pendingCooling)}
      />
      {rewardsUiEnabled ? (
        <>
          <StatCard
            value={
              <StatSafeValue
                value={rewardsModel.proof ? rewardsModel.rewards.claimable : undefined}
              />
            }
            label="Claimable rewards"
            hint={claimableHint(rewardsModel)}
          />
          <StatCard
            value={
              <StatSafeValue
                value={rewardsModel.proof ? rewardsModel.rewards.totalClaimed : undefined}
              />
            }
            label="Total claimed"
            hint="Tokens transferred"
          />
        </>
      ) : (
        <>
          <StatCard value="—" label="Claimable rewards" hint="Rewards data pending" />
          <StatCard value="—" label="Lifetime claimed" hint="Rewards data pending" />
        </>
      )}
    </div>
  )
}
