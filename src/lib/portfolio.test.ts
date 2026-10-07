import { describe, expect, it } from 'vitest'

import {
  buildPositions,
  conicGradientFromSegments,
  countCoolingDown,
  stakeSharePct,
  sumPendingWei,
} from '@/lib/portfolio'
import { buildValidator } from '@/test/fixtures'

const a = buildValidator({ address: '0xAAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaA', label: 'A' })
const b = buildValidator({ address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', label: 'B' })
const c = buildValidator({ address: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC', label: 'C' })

describe('sumPendingWei', () => {
  it('sums amounts and handles empty input', () => {
    expect(sumPendingWei(undefined)).toBe(0n)
    expect(sumPendingWei([{ amount: 2n }, { amount: 3n }])).toBe(5n)
  })
})

describe('countCoolingDown', () => {
  const queue = [{ claimableAt: 100n }, { claimableAt: 200n }]

  it('returns 0 for an empty queue and null without a block time', () => {
    expect(countCoolingDown([], undefined)).toBe(0)
    expect(countCoolingDown(queue, undefined)).toBeNull()
  })

  it('counts entries not yet claimable', () => {
    expect(countCoolingDown(queue, 150n)).toBe(1)
    expect(countCoolingDown(queue, 50n)).toBe(2)
  })
})

describe('stakeSharePct', () => {
  it('returns a two-decimal percentage', () => {
    expect(stakeSharePct(1n, 3n)).toBe(33.33)
    expect(stakeSharePct(1n, 0n)).toBe(0)
  })
})

describe('conicGradientFromSegments', () => {
  it('is transparent without stake', () => {
    expect(conicGradientFromSegments([], 0n)).toBe('transparent')
  })

  it('builds consecutive stops', () => {
    const gradient = conicGradientFromSegments(
      [
        { stake: 3n, color: 'red' },
        { stake: 1n, color: 'blue' },
      ],
      4n,
    )
    expect(gradient).toBe('conic-gradient(from -90deg, red 0% 75%, blue 75% 100%)')
  })
})

describe('buildPositions', () => {
  it('returns nothing until validators and reads are loaded', () => {
    expect(buildPositions(undefined, [], 'dark')).toEqual([])
    expect(buildPositions([a], undefined, 'dark')).toEqual([])
  })

  it('keeps positive successful stakes sorted by stake descending', () => {
    const rows = buildPositions(
      [a, b, c],
      [{ status: 'success', result: 1n }, { status: 'success', result: 5n }, { status: 'failure' }],
      'dark',
    )
    expect(rows.map((r) => [r.label, r.stake])).toEqual([
      ['B', 5n],
      ['A', 1n],
    ])
    expect(rows.every((r) => r.color.length > 0)).toBe(true)
  })

  it('skips zero stakes', () => {
    expect(buildPositions([a], [{ status: 'success', result: 0n }], 'dark')).toEqual([])
  })
})
