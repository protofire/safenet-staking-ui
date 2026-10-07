import { describe, expect, it } from 'vitest'

import {
  consecutiveMatureCount,
  cooldownProgressPct,
  formatClaimableAt,
  initiatedTimestamp,
  sumMatureAmounts,
} from '@/lib/withdrawals'

const queue = [
  { amount: 1n, claimableAt: 100n },
  { amount: 2n, claimableAt: 200n },
  { amount: 4n, claimableAt: 300n },
]

describe('consecutiveMatureCount', () => {
  it('counts matured entries from the head of the queue', () => {
    expect(consecutiveMatureCount(queue, 50n)).toBe(0)
    expect(consecutiveMatureCount(queue, 100n)).toBe(1)
    expect(consecutiveMatureCount(queue, 250n)).toBe(2)
    expect(consecutiveMatureCount(queue, 1000n)).toBe(3)
  })

  it('stops at the first unmatured entry', () => {
    const outOfOrder = [
      { amount: 1n, claimableAt: 500n },
      { amount: 1n, claimableAt: 100n },
    ]
    expect(consecutiveMatureCount(outOfOrder, 200n)).toBe(0)
  })
})

describe('cooldownProgressPct', () => {
  it('returns 100 without a delay or once claimable', () => {
    expect(cooldownProgressPct(100n, 0n, 0n)).toBe(100)
    expect(cooldownProgressPct(100n, 100n, 50n)).toBe(100)
  })

  it('returns 0 before the cooldown started', () => {
    expect(cooldownProgressPct(100n, 40n, 50n)).toBe(0)
  })

  it('returns rounded progress during the cooldown', () => {
    expect(cooldownProgressPct(100n, 75n, 50n)).toBe(50)
    expect(cooldownProgressPct(300n, 1n, 300n)).toBe(0)
    expect(cooldownProgressPct(300n, 2n, 300n)).toBe(1)
  })
})

describe('initiatedTimestamp', () => {
  it('subtracts the withdraw delay', () => {
    expect(initiatedTimestamp(100n, 30n)).toBe(70n)
    expect(initiatedTimestamp(100n, 0n)).toBe(100n)
  })
})

describe('formatClaimableAt', () => {
  it('formats a unix timestamp', () => {
    expect(formatClaimableAt(0n)).toMatch(/1970|1969/)
  })

  it('returns a dash for out-of-range timestamps', () => {
    expect(formatClaimableAt(10n ** 400n)).toBe('—')
  })
})

describe('sumMatureAmounts', () => {
  it('sums the matured prefix', () => {
    expect(sumMatureAmounts(queue, 0)).toBe(0n)
    expect(sumMatureAmounts(queue, 2)).toBe(3n)
    expect(sumMatureAmounts(queue, 10)).toBe(7n)
  })
})
