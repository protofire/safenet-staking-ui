import { Button } from '@/components/ui/button'
import { InlineAmountSkeleton } from '@/components/ui/states'
import { formatTokenAmount } from '@/lib/format'
import type { ValidatorRow } from '@/lib/validators'

export type ValidatorListViewProps = {
  rows: ValidatorRow[]
  isPending: boolean
  isConnected: boolean
  totalsPending: boolean
  stakesPending: boolean
  onStake: (address: `0x${string}`) => void
  onUnstake: (address: `0x${string}`) => void
}

export function SafeAmount({
  value,
  pending,
  skeletonSize = 'md',
}: {
  value: bigint | undefined
  pending: boolean
  skeletonSize?: 'sm' | 'md'
}) {
  if (pending) return <InlineAmountSkeleton size={skeletonSize} className="ml-auto" />
  return (
    <>
      <span className="whitespace-nowrap">{formatTokenAmount(value ?? 0n)}</span>
      <span className="ml-1 font-normal text-text-muted">SAFE</span>
    </>
  )
}

export function ValidatorActions({
  address,
  stakeDisabled,
  unstakeDisabled,
  className,
  onStake,
  onUnstake,
}: {
  address: `0x${string}`
  stakeDisabled: boolean
  unstakeDisabled: boolean
  className: string
  onStake: (address: `0x${string}`) => void
  onUnstake: (address: `0x${string}`) => void
}) {
  return (
    <>
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={stakeDisabled}
        className={className}
        onClick={() => onStake(address)}
      >
        Stake
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={unstakeDisabled}
        className={className}
        onClick={() => onUnstake(address)}
      >
        Unstake
      </Button>
    </>
  )
}
