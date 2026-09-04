import { useModal } from 'connectkit'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAddress, isAddress } from 'viem'

import { StakeDialog } from '@/components/staking/StakeDialog'
import { UndelegateDialog } from '@/components/staking/UndelegateDialog'
import { ValidatorFilterBar } from '@/components/validators/ValidatorFilterBar'
import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import {
  InlineAmountSkeleton,
  ValidatorMobileSkeletonList,
  ValidatorTableSkeletonRows,
} from '@/components/ui/states'
import { useUserStakesOnValidators, useValidatorTotalStakes } from '@/hooks/useStakingReads'
import { useValidators } from '@/hooks/useValidators'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatTokenAmount } from '@/lib/format'
import { tableThClass } from '@/lib/table'
import { cn } from '@/lib/utils'
import {
  applyValidatorSearch,
  applyValidatorSort,
  applyValidatorStatusFilter,
  countValidatorsByStatus,
  type ValidatorSort,
  type ValidatorStatusFilter,
} from '@/lib/validators'

export default function Validators() {
  const { isConnected } = useWalletReady()
  const { setOpen } = useModal()
  const [searchParams, setSearchParams] = useSearchParams()
  const delegateQs = searchParams.get('delegate')
  const undelegateQs = searchParams.get('undelegate')
  const { data, isPending, isError, isFetching, error, refetch } = useValidators()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ValidatorStatusFilter>('all')
  const [sort, setSort] = useState<ValidatorSort>('default')
  const deepStakeCandidate =
    delegateQs && isAddress(delegateQs) ? getAddress(delegateQs) : null
  const deepUnstakeCandidate =
    !deepStakeCandidate && undelegateQs && isAddress(undelegateQs)
      ? getAddress(undelegateQs)
      : null
  const findRegistered = (addr: `0x${string}` | null) =>
    addr ? data?.find((v) => v.address.toLowerCase() === addr.toLowerCase()) : undefined
  const deepStakeEntry = findRegistered(deepStakeCandidate)
  const deepStakeValidator =
    deepStakeEntry !== undefined && deepStakeEntry.isActive ? deepStakeCandidate : null
  const deepUnstakeValidator =
    findRegistered(deepUnstakeCandidate) !== undefined ? deepUnstakeCandidate : null
  const deepLinkBlocked =
    (delegateQs !== null &&
      (deepStakeCandidate === null || (data !== undefined && deepStakeValidator === null))) ||
    (delegateQs === null &&
      undelegateQs !== null &&
      (deepUnstakeCandidate === null || (data !== undefined && deepUnstakeValidator === null)))
  const [manualStakeOpen, setManualStakeOpen] = useState(false)
  const [manualStakeValidator, setManualStakeValidator] = useState<`0x${string}` | null>(null)
  const [manualUnstakeOpen, setManualUnstakeOpen] = useState(false)
  const [manualUnstakeValidator, setManualUnstakeValidator] = useState<`0x${string}` | null>(null)
  const stakeValidator = deepStakeValidator ?? manualStakeValidator
  const stakeOpen = deepStakeValidator !== null || manualStakeOpen
  const unstakeValidator = deepUnstakeValidator ?? manualUnstakeValidator
  const unstakeOpen = deepUnstakeValidator !== null || manualUnstakeOpen

  const handleStakeDialogOpenChange = useCallback(
    (open: boolean) => {
      setManualStakeOpen(open)
      if (!open) {
        setManualStakeValidator(null)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('delegate')
          return next
        })
      }
    },
    [setSearchParams],
  )

  const handleUndelegateOpenChange = useCallback(
    (open: boolean) => {
      setManualUnstakeOpen(open)
      if (!open) {
        setManualUnstakeValidator(null)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('undelegate')
          return next
        })
      }
    },
    [setSearchParams],
  )

  const networkSummary = useMemo(
    () => countValidatorsByStatus(data ?? []),
    [data],
  )

  const preSort = useMemo(() => {
    if (!data) return []
    const byStatus = applyValidatorStatusFilter(data, statusFilter)
    return applyValidatorSearch(byStatus, search)
  }, [data, statusFilter, search])

  const preSortAddresses = useMemo(() => preSort.map((v) => v.address), [preSort])

  const { data: validatorTotals, isPending: totalsPending } =
    useValidatorTotalStakes(preSortAddresses)

  const stakeTotalsByAddress = useMemo(() => {
    const map = new Map<string, bigint>()
    preSort.forEach((v, i) => {
      const r = validatorTotals?.[i]
      if (r?.status === 'success' && typeof r.result === 'bigint') {
        map.set(v.address.toLowerCase(), r.result)
      }
    })
    return map
  }, [preSort, validatorTotals])

  const visible = useMemo(
    () => applyValidatorSort(preSort, sort, stakeTotalsByAddress),
    [preSort, sort, stakeTotalsByAddress],
  )

  const visibleAddresses = useMemo(() => visible.map((v) => v.address), [visible])

  const { data: stakeReads, isPending: stakesPending } =
    useUserStakesOnValidators(visibleAddresses)

  function rowStakeWei(index: number): bigint | undefined {
    const r = stakeReads?.[index]
    if (r?.status !== 'success' || typeof r.result !== 'bigint') return undefined
    return r.result
  }

  function rowValidatorTotalWei(address: `0x${string}`): bigint | undefined {
    return stakeTotalsByAddress.get(address.toLowerCase())
  }

  const openStake = (validatorAddress: string) => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    if (!isAddress(validatorAddress)) return
    const checksum = getAddress(validatorAddress)
    setManualStakeValidator(checksum)
    setManualStakeOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('delegate', checksum)
      next.delete('undelegate')
      return next
    })
  }

  const openUndelegate = (validatorAddress: string) => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    if (!isAddress(validatorAddress)) return
    const checksum = getAddress(validatorAddress)
    setManualUnstakeValidator(checksum)
    setManualUnstakeOpen(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('undelegate', checksum)
      next.delete('delegate')
      return next
    })
  }

  return (
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <header className="mb-6 hidden items-end justify-between gap-6 md:flex">
          <div>
            <h1 className="m-0 text-[22px] font-semibold tracking-tight text-text">
              Validators
            </h1>
          </div>
          {!isPending && data && (
            <span className="shrink-0 font-mono text-[11px] tracking-[0.12em] text-text-subtle uppercase">
              {networkSummary.active} ACTIVE {networkSummary.inactive} INACTIVE
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
              search={search}
              onSearchChange={setSearch}
              filter={statusFilter}
              onFilterChange={setStatusFilter}
              sort={sort}
              onSortChange={setSort}
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

        {deepLinkBlocked && (
          <p className="mb-4 text-sm text-danger" role="alert">
            The validator address in this link is not in the validator registry, so the dialog was
            not opened. Choose a validator from the list below.
          </p>
        )}

        {stakeValidator && (
          <StakeDialog
            validator={stakeValidator}
            open={stakeOpen}
            onOpenChange={handleStakeDialogOpenChange}
          />
        )}

        {unstakeValidator && (
          <UndelegateDialog
            validator={unstakeValidator}
            open={unstakeOpen}
            onOpenChange={handleUndelegateOpenChange}
          />
        )}

        <div
          className="divide-y divide-border-faint md:hidden"
          aria-busy={isPending}
          aria-label={isPending ? 'Loading validators' : undefined}
        >
          {isPending && <ValidatorMobileSkeletonList count={5} />}

          {!isPending &&
            visible.map((v, index) => {
              const delegated = rowStakeWei(index)
              const hasDelegated = delegated !== undefined && delegated > 0n
              const stakeDisabled = !v.isActive
              const unstakeDisabled = isConnected && (stakesPending || !hasDelegated)
              const totalOnValidator = rowValidatorTotalWei(v.address)
              const showTotalPending = totalsPending && totalOnValidator === undefined

              return (
                <div key={v.address} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-text">
                      {v.label}
                    </span>
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
                      {showTotalPending ? (
                        <InlineAmountSkeleton size="sm" className="ml-auto" />
                      ) : (
                        <>
                          {formatTokenAmount(totalOnValidator ?? 0n)}{' '}
                          <span className="font-normal text-text-muted">SAFE</span>
                        </>
                      )}
                    </dd>
                    <dt className="text-text-muted">Your tokens staked</dt>
                    <dd className="text-right font-mono tabular-nums text-text">
                      {!isConnected ? (
                        '—'
                      ) : stakesPending || delegated === undefined ? (
                        <InlineAmountSkeleton size="sm" className="ml-auto" />
                      ) : (
                        <>
                          {formatTokenAmount(delegated)}{' '}
                          <span className="font-normal text-text-muted">SAFE</span>
                        </>
                      )}
                    </dd>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={stakeDisabled}
                      className="h-10 min-h-10 flex-1 text-sm font-medium lg:h-11 lg:min-h-11"
                      onClick={() => openStake(v.address)}
                    >
                      Stake
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={unstakeDisabled}
                      className="h-10 min-h-10 flex-1 text-sm font-medium lg:h-11 lg:min-h-11"
                      onClick={() => openUndelegate(v.address)}
                    >
                      Unstake
                    </Button>
                  </div>
                </div>
              )
            })}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-sunken">
                <th scope="col" className={cn(tableThClass, 'w-10 text-left')}>
                  #
                </th>
                <th scope="col" className={cn(tableThClass, 'w-[1%] text-left')}>
                  Validator
                </th>
                <th scope="col" className={cn(tableThClass, 'w-px whitespace-nowrap text-right')}>
                  Commission
                </th>
                <th scope="col" className={cn(tableThClass, 'w-px whitespace-nowrap text-right')}>
                  Part. 14d
                </th>
                <th scope="col" className={cn(tableThClass, 'text-right')}>
                  Total
                </th>
                <th scope="col" className={cn(tableThClass, 'w-px whitespace-nowrap text-right')}>
                  Status
                </th>
                <th scope="col" className={cn(tableThClass, 'text-right')}>
                  Your tokens staked
                </th>
                <th scope="col" className={cn(tableThClass, 'w-px whitespace-nowrap')}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody aria-busy={isPending} aria-label={isPending ? 'Loading validators' : undefined}>
              {isPending && <ValidatorTableSkeletonRows count={6} />}

              {!isPending &&
                visible.map((v, index) => {
                  const delegated = rowStakeWei(index)
                  const hasDelegated = delegated !== undefined && delegated > 0n
                  const stakeDisabled = !v.isActive
                  const unstakeDisabled = isConnected && (stakesPending || !hasDelegated)
                  const totalOnValidator = rowValidatorTotalWei(v.address)
                  const showTotalPending = totalsPending && totalOnValidator === undefined
                  const showTokensPending =
                    isConnected && (stakesPending || delegated === undefined)

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
                      <td className="w-px whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text-muted">
                        {(v.commission * 100).toFixed(1)}%
                      </td>
                      <td className="w-px whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text-muted">
                        {(v.participationRate14d * 100).toFixed(2)}%
                      </td>
                      <td
                        className="whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text"
                        aria-label={
                          showTotalPending
                            ? undefined
                            : `${formatTokenAmount(totalOnValidator ?? 0n)} SAFE total staked`
                        }
                      >
                        {showTotalPending ? (
                          <InlineAmountSkeleton className="ml-auto" />
                        ) : (
                          <>
                            <span className="whitespace-nowrap">
                              {formatTokenAmount(totalOnValidator ?? 0n)}
                            </span>
                            <span className="ml-1 font-normal text-text-muted">SAFE</span>
                          </>
                        )}
                      </td>
                      <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                        <Pill tone={v.isActive ? 'success' : 'default'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </Pill>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text">
                        {!isConnected ? (
                          '—'
                        ) : showTokensPending ? (
                          <InlineAmountSkeleton className="ml-auto" />
                        ) : (
                          <>
                            <span className="whitespace-nowrap">
                              {formatTokenAmount(delegated ?? 0n)}
                            </span>
                            <span className="ml-1 font-normal text-text-muted">SAFE</span>
                          </>
                        )}
                      </td>
                      <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={stakeDisabled}
                            className="h-8 font-medium"
                            onClick={() => openStake(v.address)}
                          >
                            Stake
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={unstakeDisabled}
                            className="h-8 font-medium"
                            onClick={() => openUndelegate(v.address)}
                          >
                            Unstake
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {!isPending && !isError && visible.length === 0 && (
          <p className="mt-4 px-1 py-8 text-center text-sm text-text-muted md:py-12">
            No validators match your filters.
          </p>
        )}
      </main>
  )
}
