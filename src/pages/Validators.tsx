import { useModal } from 'connectkit'

import { StakeDialog } from '@/components/staking/StakeDialog'
import { UndelegateDialog } from '@/components/staking/UndelegateDialog'
import { Button } from '@/components/ui/button'
import { ValidatorFilterBar } from '@/components/validators/ValidatorFilterBar'
import { ValidatorMobileList } from '@/components/validators/ValidatorMobileList'
import { ValidatorTable } from '@/components/validators/ValidatorTable'
import { useValidatorDialogs } from '@/hooks/useValidatorDialogs'
import { useValidatorList } from '@/hooks/useValidatorList'
import { useValidators } from '@/hooks/useValidators'
import { useWalletReady } from '@/hooks/useWalletReady'

export default function Validators() {
  const { isConnected } = useWalletReady()
  const { setOpen } = useModal()
  const { data, isPending, isError, isFetching, error, refetch } = useValidators()
  const list = useValidatorList(data)
  const dialogs = useValidatorDialogs({
    validators: data,
    isConnected,
    onConnectRequired: () => setOpen(true),
  })

  const listViewProps = {
    rows: list.rows,
    isPending,
    isConnected,
    totalsPending: list.totalsPending,
    stakesPending: list.stakesPending,
    onStake: dialogs.openStake,
    onUnstake: dialogs.openUnstake,
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <header className="mb-6 hidden items-end justify-between gap-6 md:flex">
        <div>
          <h1>Validators</h1>
        </div>
        {!isPending && data && (
          <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-text-subtle uppercase">
            {list.networkSummary.active} ACTIVE {list.networkSummary.inactive} INACTIVE
          </span>
        )}
      </header>

      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border-faint bg-bg/95 px-4 py-3 backdrop-blur-sm md:static md:z-auto md:mx-0 md:mb-5 md:border-0 md:bg-transparent md:px-0 md:py-0">
        <p className="eyebrow mb-3 md:hidden">
          Validators
          {!isPending && data ? ` ${data.length}` : ''}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <ValidatorFilterBar
            className="min-w-0 flex-1"
            search={list.search}
            onSearchChange={list.setSearch}
            filter={list.statusFilter}
            onFilterChange={list.setStatusFilter}
            sort={list.sort}
            onSortChange={list.setSort}
          />
          {isError && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              className="shrink-0"
              onClick={() => void refetch()}
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </Button>
          )}
        </div>
      </div>

      {isError && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {error instanceof Error ? error.message : 'Failed to load validators.'}
        </p>
      )}

      {dialogs.deepLinkBlocked && (
        <p className="mb-4 text-sm text-danger" role="alert">
          The validator address in this link is not in the validator registry, so the dialog was not
          opened. Choose a validator from the list below.
        </p>
      )}

      {dialogs.stake.validator && (
        <StakeDialog
          validator={dialogs.stake.validator}
          open={dialogs.stake.open}
          onOpenChange={dialogs.stake.onOpenChange}
        />
      )}

      {dialogs.unstake.validator && (
        <UndelegateDialog
          validator={dialogs.unstake.validator}
          open={dialogs.unstake.open}
          onOpenChange={dialogs.unstake.onOpenChange}
        />
      )}

      <ValidatorMobileList {...listViewProps} />
      <ValidatorTable {...listViewProps} />

      {!isPending && !isError && list.rows.length === 0 && (
        <p className="mt-4 px-1 py-8 text-center text-sm text-text-muted md:py-12">
          No validators match your filters.
        </p>
      )}
    </main>
  )
}
