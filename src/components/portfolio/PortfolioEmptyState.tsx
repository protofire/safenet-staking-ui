import { Button } from '@/components/ui/button'
import { formatTokenAmount } from '@/lib/format'

export function PortfolioEmptyState({
  stakeOutsideRegistry,
  totalStakeWei,
  onBrowse,
}: {
  stakeOutsideRegistry: boolean
  totalStakeWei: bigint | undefined
  onBrowse: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14">
      {stakeOutsideRegistry ? (
        <>
          <p className="text-sm font-semibold text-warning">Stake not shown in this breakdown</p>
          <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
            You still have{' '}
            <span className="font-mono tabular-nums">
              {totalStakeWei !== undefined ? formatTokenAmount(totalStakeWei) : '—'} SAFE
            </span>{' '}
            staked, but none of the validators listed here match that stake. Open Validators to
            unstake using the validator you chose, or confirm you are on the same network as when
            you staked.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-text">
            You have no stake with the validators listed here.
          </p>
          <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
            After you stake with a validator, it appears in the chart and table.
          </p>
        </>
      )}
      <Button type="button" className="mt-6 font-semibold" onClick={onBrowse}>
        {stakeOutsideRegistry ? 'Open validators' : 'Browse validators'}
      </Button>
    </div>
  )
}
