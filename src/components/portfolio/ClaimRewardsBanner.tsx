import { Button } from '@/components/ui/button'
import { formatTokenAmount } from '@/lib/format'

export type ClaimRewardsBannerProps = {
  claimableWei: bigint
  rootStale: boolean
  rewardsEnabled: boolean
  portfolioEmpty: boolean
  onClaim: () => void
}

export function ClaimRewardsBanner({
  claimableWei,
  rootStale,
  rewardsEnabled,
  portfolioEmpty,
  onClaim,
}: ClaimRewardsBannerProps) {
  if (!rewardsEnabled) return null
  if (portfolioEmpty) return null
  if (claimableWei <= 0n) return null
  if (rootStale) return null

  return (
    <div
      role="status"
      className="flex items-center gap-4 rounded-md border border-border bg-card px-5 py-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[15px] font-medium text-text">
          <span className="font-mono tabular-nums">
            {formatTokenAmount(claimableWei)}{' '}
            <span className="font-sans font-medium text-text-muted">SAFE</span>
          </span>
          <span className="text-text-muted">available to claim</span>
        </div>
        <p className="mt-1 text-xs text-text-muted">Accrued after staking in validators</p>
      </div>
      <Button type="button" size="sm" className="shrink-0 font-semibold" onClick={onClaim}>
        Claim
      </Button>
    </div>
  )
}
