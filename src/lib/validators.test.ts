import { describe, expect, it } from 'vitest'

import { buildValidator } from '@/test/fixtures'

import {
  applyValidatorSearch,
  applyValidatorSort,
  applyValidatorStatusFilter,
  countValidatorsByStatus,
} from './validators'

const alpha = buildValidator({
  address: '0xAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaA',
  label: 'Alpha Node',
  isActive: true,
})
const beta = buildValidator({
  address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
  label: 'Beta Staking',
  isActive: false,
})
const gamma = buildValidator({
  address: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  label: 'Gamma',
  isActive: true,
})
const all = [alpha, beta, gamma]

describe('countValidatorsByStatus', () => {
  it('counts active and inactive validators', () => {
    expect(countValidatorsByStatus(all)).toEqual({ active: 2, inactive: 1 })
    expect(countValidatorsByStatus([])).toEqual({ active: 0, inactive: 0 })
  })
})

describe('applyValidatorStatusFilter', () => {
  it('returns the same list for "all"', () => {
    expect(applyValidatorStatusFilter(all, 'all')).toBe(all)
  })

  it('filters by status', () => {
    expect(applyValidatorStatusFilter(all, 'active')).toEqual([alpha, gamma])
    expect(applyValidatorStatusFilter(all, 'inactive')).toEqual([beta])
  })
})

describe('applyValidatorSearch', () => {
  it('returns the same list for blank search', () => {
    expect(applyValidatorSearch(all, '   ')).toBe(all)
  })

  it('matches label case-insensitively', () => {
    expect(applyValidatorSearch(all, 'STAKING')).toEqual([beta])
  })

  it('matches on address fragments', () => {
    expect(applyValidatorSearch(all, '0xcccc')).toEqual([gamma])
  })
})

describe('applyValidatorSort', () => {
  const totals = new Map<string, bigint>([
    [alpha.address.toLowerCase(), 100n],
    [beta.address.toLowerCase(), 300n],
  ])

  it('returns the same list for the default sort', () => {
    expect(applyValidatorSort(all, 'default', totals)).toBe(all)
  })

  it('sorts by stake descending, treating missing totals as zero', () => {
    expect(applyValidatorSort(all, 'stake-desc', totals)).toEqual([beta, alpha, gamma])
  })

  it('sorts by stake ascending', () => {
    expect(applyValidatorSort(all, 'stake-asc', totals)).toEqual([gamma, alpha, beta])
  })

  it('does not mutate the input', () => {
    const input = [...all]
    applyValidatorSort(input, 'stake-desc', totals)
    expect(input).toEqual(all)
  })

  it('keeps order when no totals are provided', () => {
    expect(applyValidatorSort(all, 'stake-desc')).toEqual(all)
  })
})
