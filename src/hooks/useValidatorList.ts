import { useMemo, useState } from 'react'

import { useUserStakesOnValidators, useValidatorTotalStakes } from '@/hooks/useStakingReads'
import type { ValidatorInfo } from '@/hooks/useValidators'
import {
  applyValidatorSearch,
  applyValidatorSort,
  applyValidatorStatusFilter,
  countValidatorsByStatus,
  type ValidatorRow,
  type ValidatorSort,
  type ValidatorStatusFilter,
} from '@/lib/validators'

export function useValidatorList(data: ValidatorInfo[] | undefined) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ValidatorStatusFilter>('all')
  const [sort, setSort] = useState<ValidatorSort>('default')

  const networkSummary = useMemo(() => countValidatorsByStatus(data ?? []), [data])

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

  const { data: stakeReads, isPending: stakesPending } = useUserStakesOnValidators(visibleAddresses)

  const rows = useMemo<ValidatorRow[]>(
    () =>
      visible.map((validator, index) => {
        const r = stakeReads?.[index]
        return {
          validator,
          delegatedWei:
            r?.status === 'success' && typeof r.result === 'bigint' ? r.result : undefined,
          totalWei: stakeTotalsByAddress.get(validator.address.toLowerCase()),
        }
      }),
    [visible, stakeReads, stakeTotalsByAddress],
  )

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    networkSummary,
    rows,
    totalsPending,
    stakesPending,
  }
}
