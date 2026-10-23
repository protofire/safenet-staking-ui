import { AddressMono } from '@/components/ui/address-mono'
import { Pill } from '@/components/ui/pill'
import { ValidatorTableSkeletonRows } from '@/components/ui/states'
import { TableHead } from '@/components/ui/table'
import {
  SafeAmount,
  ValidatorActions,
  type ValidatorListViewProps,
} from '@/components/validators/ValidatorRowParts'
import { formatPercentFromRate, formatTokenAmount } from '@/lib/format'
import { getValidatorRowState } from '@/lib/validators'

const numericCell = 'px-5 py-3 text-right font-mono text-xs tabular-nums'

export function ValidatorTable(props: ValidatorListViewProps) {
  const { rows, isPending, isConnected, onStake, onUnstake } = props

  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-sunken">
            <TableHead className="w-10 text-left">#</TableHead>
            <TableHead className="w-[1%] text-left">Validator</TableHead>
            <TableHead className="w-px whitespace-nowrap text-right">Commission</TableHead>
            <TableHead className="w-px whitespace-nowrap text-right">Part. 14d</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-px whitespace-nowrap text-right">Status</TableHead>
            <TableHead className="text-right">Your tokens staked</TableHead>
            <TableHead className="w-px whitespace-nowrap">
              <span className="sr-only">Actions</span>
            </TableHead>
          </tr>
        </thead>
        <tbody aria-busy={isPending} aria-label={isPending ? 'Loading validators' : undefined}>
          {isPending && <ValidatorTableSkeletonRows count={6} />}

          {!isPending &&
            rows.map((row, index) => {
              const { validator: v } = row
              const state = getValidatorRowState(row, props)

              return (
                <tr
                  key={v.address}
                  className="border-b border-border-faint transition-colors hover:bg-surface-hover"
                >
                  <td className="px-5 py-3 font-mono text-xs tabular-nums text-text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-text">{v.label}</span>
                      <AddressMono value={v.address} compact truncated />
                    </div>
                  </td>
                  <td className={`w-px whitespace-nowrap ${numericCell} text-text-muted`}>
                    {formatPercentFromRate(v.commission, 1)}
                  </td>
                  <td className={`w-px whitespace-nowrap ${numericCell} text-text-muted`}>
                    {formatPercentFromRate(v.participationRate14d)}
                  </td>
                  <td
                    className={`whitespace-nowrap ${numericCell} text-text`}
                    aria-label={
                      state.totalPending
                        ? undefined
                        : `${formatTokenAmount(row.totalWei ?? 0n)} SAFE total staked`
                    }
                  >
                    <SafeAmount value={row.totalWei} pending={state.totalPending} />
                  </td>
                  <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                    <Pill tone={v.isActive ? 'success' : 'default'}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </Pill>
                  </td>
                  <td className={`whitespace-nowrap ${numericCell} text-text`}>
                    {isConnected ? (
                      <SafeAmount value={row.delegatedWei} pending={state.delegatedPending} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <ValidatorActions
                        address={v.address}
                        stakeDisabled={state.stakeDisabled}
                        unstakeDisabled={state.unstakeDisabled}
                        className="h-8 font-medium"
                        onStake={onStake}
                        onUnstake={onUnstake}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
