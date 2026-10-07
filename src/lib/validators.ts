import type { ValidatorInfo } from '@/hooks/useValidators'

export type ValidatorStatusFilter = 'active' | 'inactive' | 'all'

export type ValidatorSort = 'default' | 'stake-desc' | 'stake-asc'

export type ValidatorRow = {
  validator: ValidatorInfo
  delegatedWei: bigint | undefined
  totalWei: bigint | undefined
}

export function countValidatorsByStatus(items: ValidatorInfo[]) {
  let active = 0
  let inactive = 0
  for (const v of items) {
    if (v.isActive) active += 1
    else inactive += 1
  }
  return { active, inactive }
}

export function applyValidatorStatusFilter(
  items: ValidatorInfo[],
  filter: ValidatorStatusFilter,
): ValidatorInfo[] {
  if (filter === 'all') return items
  return items.filter((v) => (filter === 'active' ? v.isActive : !v.isActive))
}

export function applyValidatorSearch(items: ValidatorInfo[], search: string): ValidatorInfo[] {
  const q = search.trim().toLowerCase()
  if (!q) return items
  return items.filter((v) => {
    const hay = `${v.label} ${v.address}`.toLowerCase()
    return hay.includes(q)
  })
}

export function applyValidatorSort(
  items: ValidatorInfo[],
  sort: ValidatorSort,
  stakeTotals?: Map<string, bigint>,
): ValidatorInfo[] {
  if (sort === 'default') return items

  const out = [...items]
  const stakeOf = (v: ValidatorInfo) => stakeTotals?.get(v.address.toLowerCase()) ?? 0n

  switch (sort) {
    case 'stake-desc':
      out.sort((a, b) => {
        const diff = stakeOf(b) - stakeOf(a)
        return diff > 0n ? 1 : diff < 0n ? -1 : 0
      })
      break
    case 'stake-asc':
      out.sort((a, b) => {
        const diff = stakeOf(a) - stakeOf(b)
        return diff > 0n ? 1 : diff < 0n ? -1 : 0
      })
      break
  }
  return out
}

export function getValidatorRowState(
  { validator, delegatedWei, totalWei }: ValidatorRow,
  {
    isConnected,
    totalsPending,
    stakesPending,
  }: { isConnected: boolean; totalsPending: boolean; stakesPending: boolean },
) {
  const hasDelegated = delegatedWei !== undefined && delegatedWei > 0n
  return {
    stakeDisabled: !validator.isActive,
    unstakeDisabled: isConnected && (stakesPending || !hasDelegated),
    totalPending: totalsPending && totalWei === undefined,
    delegatedPending: isConnected && (stakesPending || delegatedWei === undefined),
  }
}
