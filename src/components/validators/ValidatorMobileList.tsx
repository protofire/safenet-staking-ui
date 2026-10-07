import { AddressMono } from '@/components/ui/address-mono'
import { Pill } from '@/components/ui/pill'
import { ValidatorMobileSkeletonList } from '@/components/ui/states'
import {
  SafeAmount,
  ValidatorActions,
  type ValidatorListViewProps,
} from '@/components/validators/ValidatorRowParts'
import { getValidatorRowState } from '@/lib/validators'

export function ValidatorMobileList(props: ValidatorListViewProps) {
  const { rows, isPending, isConnected, onStake, onUnstake } = props

  return (
    <div
      className="divide-y divide-border-faint md:hidden"
      aria-busy={isPending}
      aria-label={isPending ? 'Loading validators' : undefined}
    >
      {isPending && <ValidatorMobileSkeletonList count={5} />}

      {!isPending &&
        rows.map((row) => {
          const { validator: v } = row
          const state = getValidatorRowState(row, props)

          return (
            <div key={v.address} className="py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-semibold text-text">{v.label}</span>
                <Pill tone={v.isActive ? 'success' : 'default'} className="shrink-0">
                  {v.isActive ? 'Active' : 'Inactive'}
                </Pill>
              </div>
              <AddressMono value={v.address} compact truncated className="mt-1" />
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:text-sm">
                <dt className="text-text-muted">Commission</dt>
                <dd className="text-right font-mono tabular-nums text-text-muted">
                  {(v.commission * 100).toFixed(1)}%
                </dd>
                <dt className="text-text-muted">Part. 14d</dt>
                <dd className="text-right font-mono tabular-nums text-text-muted">
                  {(v.participationRate14d * 100).toFixed(2)}%
                </dd>
                <dt className="text-text-muted">Total staked</dt>
                <dd className="text-right font-mono tabular-nums text-text">
                  <SafeAmount value={row.totalWei} pending={state.totalPending} skeletonSize="sm" />
                </dd>
                <dt className="text-text-muted">Your tokens staked</dt>
                <dd className="text-right font-mono tabular-nums text-text">
                  {isConnected ? (
                    <SafeAmount
                      value={row.delegatedWei}
                      pending={state.delegatedPending}
                      skeletonSize="sm"
                    />
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
              <div className="mt-3 flex gap-2">
                <ValidatorActions
                  address={v.address}
                  stakeDisabled={state.stakeDisabled}
                  unstakeDisabled={state.unstakeDisabled}
                  className="h-10 min-h-10 flex-1 text-sm font-medium lg:h-11 lg:min-h-11"
                  onStake={onStake}
                  onUnstake={onUnstake}
                />
              </div>
            </div>
          )
        })}
    </div>
  )
}
