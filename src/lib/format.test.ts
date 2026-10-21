import { describe, expect, it } from 'vitest'

import {
  formatAmountInputDisplay,
  formatCooldownForBlurb,
  formatCountdown,
  formatDurationFromSeconds,
  formatPercent,
  formatPercentFromRate,
  formatTokenAmount,
  formatTokenAmountPrecise,
  formatTxHashShort,
  formatUnstakingDelayCompact,
  formatUnstakingDelayStat,
  isValidAmountInput,
  safeParseEther,
  truncateMiddleParts,
  truncateStakeAddress,
} from './format'

const SAFE = 10n ** 18n

describe('formatTokenAmount', () => {
  it('formats zero', () => {
    expect(formatTokenAmount(0n)).toBe('0')
  })

  it('floors tiny amounts below 0.00001 SAFE', () => {
    expect(formatTokenAmount(1n)).toBe('< 0.00001')
    expect(formatTokenAmount(1_678_630_000_000n)).toBe('< 0.00001')
    expect(formatTokenAmount(123_450_000_000n)).toBe('< 0.00001')
  })

  it('shows amounts at and above the floor threshold', () => {
    expect(formatTokenAmount(10_000_000_000_000n)).toBe('0.00001')
    expect(formatTokenAmount(49_999_999_999_999n)).toBe('0.00005')
    expect(formatTokenAmount(999_990_000_000_000_000n)).toBe('0.99999')
  })

  it('uses 5 decimals below 1', () => {
    expect(formatTokenAmount(123_456_789n * 10n ** 9n)).toBe('0.12346')
    expect(formatTokenAmount(999_995n * 10n ** 12n)).toBe('1')
  })

  it('uses 4 decimals from 1 to under 1,000', () => {
    expect(formatTokenAmount(1_500_000_000_000_000_000n)).toBe('1.5')
    expect(formatTokenAmount(123_123_456n * 10n ** 12n)).toBe('123.1235')
    expect(formatTokenAmount(999_999_960_000_000_000_000n)).toBe('1,000')
  })

  it('uses 2 decimals from 1,000 to under one million', () => {
    expect(formatTokenAmount(1_000_123_456n * 10n ** 12n)).toBe('1,000.12')
    expect(formatTokenAmount(123_456_789n * 10n ** 14n)).toBe('12,345.68')
    expect(formatTokenAmount(999_999_994n * 10n ** 15n)).toBe('999,999.99')
  })

  it('formats whole token amounts without fractional digits', () => {
    expect(formatTokenAmount(1_500_000_000_000_000_000_000n)).toBe('1,500')
    expect(formatTokenAmount(999_999n * SAFE)).toBe('999,999')
  })

  it('uses compact notation from one million up', () => {
    expect(formatTokenAmount(999_999_995_000_000_000_000_000n)).toBe('1M')
    expect(formatTokenAmount(1_000_000n * SAFE)).toBe('1M')
    expect(formatTokenAmount(1_234_567n * SAFE)).toBe('1.23M')
    expect(formatTokenAmount(123_456_789n * 10n ** 16n)).toBe('1.23M')
    expect(formatTokenAmount(2_500_000_000n * SAFE)).toBe('2.5B')
  })

  it('routes explicit precision to the precise formatter', () => {
    expect(formatTokenAmount(1_239_000_000_000_000_000n, 18, 2)).toBe('1.24')
  })
})

describe('formatPercent', () => {
  it('formats a percent value with the requested precision', () => {
    expect(formatPercent(98.123)).toBe('98.12%')
    expect(formatPercent(5, 1)).toBe('5.0%')
  })

  it('renders a dash for a missing value', () => {
    expect(formatPercent(null)).toBe('—')
  })
})

describe('formatPercentFromRate', () => {
  it('scales a ratio to percent', () => {
    expect(formatPercentFromRate(0.98)).toBe('98.00%')
    expect(formatPercentFromRate(1)).toBe('100.00%')
  })

  it('renders a dash for a missing rate', () => {
    expect(formatPercentFromRate(null)).toBe('—')
  })
})

describe('formatTokenAmountPrecise', () => {
  it('shows full precision with trailing zeros trimmed', () => {
    expect(formatTokenAmountPrecise(1_678_630_000_000n)).toBe('0.00000167863')
    expect(formatTokenAmountPrecise(1n)).toBe('0.000000000000000001')
  })

  it('preserves digits that float64 would lose', () => {
    expect(formatTokenAmountPrecise(16_000_000_000_020_475n)).toBe('0.016000000000020475')
  })

  it('formats zero', () => {
    expect(formatTokenAmountPrecise(0n)).toBe('0')
  })

  it('rounds half-up to the requested precision and delimits the whole part', () => {
    expect(formatTokenAmountPrecise(1_234_567_895n * 10n ** 15n, 18, 2)).toBe('1,234,567.9')
    expect(formatTokenAmountPrecise(999_995n * 10n ** 13n, 18, 4)).toBe('10')
    expect(formatTokenAmountPrecise(15n * 10n ** 17n, 18, 0)).toBe('2')
  })

  it('keeps full precision when precision is not below the token decimals', () => {
    expect(formatTokenAmountPrecise(1_500_000n, 6, 6)).toBe('1.5')
    expect(formatTokenAmountPrecise(1_500_000n, 6, 9)).toBe('1.5')
  })
})

describe('formatTokenAmount with custom decimals', () => {
  it('floors and formats relative to the token decimals', () => {
    expect(formatTokenAmount(9n, 6)).toBe('< 0.00001')
    expect(formatTokenAmount(10n, 6)).toBe('0.00001')
    expect(formatTokenAmount(1_500_000n, 6)).toBe('1.5')
  })
})

describe('formatAmountInputDisplay', () => {
  it('returns empty string for empty input', () => {
    expect(formatAmountInputDisplay('')).toBe('')
  })

  it('re-delimits already delimited input', () => {
    expect(formatAmountInputDisplay('1,2,34567')).toBe('1,234,567')
  })

  it('preserves a trailing decimal point while typing', () => {
    expect(formatAmountInputDisplay('1234.')).toBe('1,234.')
  })

  it('does not delimit the decimal part', () => {
    expect(formatAmountInputDisplay('1234.56789')).toBe('1,234.56789')
  })
})

describe('isValidAmountInput', () => {
  it.each(['', '0', '12', '12.', '.5', '1,000.25'])('accepts %j', (value) => {
    expect(isValidAmountInput(value)).toBe(true)
  })

  it.each(['abc', '1.2.3', '-1', '1e5', ' 1'])('rejects %j', (value) => {
    expect(isValidAmountInput(value)).toBe(false)
  })
})

describe('safeParseEther', () => {
  it('parses delimited amounts', () => {
    expect(safeParseEther('1,000.5')).toBe(10005n * 10n ** 17n)
  })

  it('returns 0 for empty input', () => {
    expect(safeParseEther('')).toBe(0n)
  })

  it('returns 0 instead of throwing on invalid input', () => {
    expect(safeParseEther('1.2.3')).toBe(0n)
  })
})

describe('truncateMiddleParts', () => {
  const address = '0x0faa1250a0cf6988fa25ba24e06dc85079174264'

  it('keeps 0x plus lead characters and the tail', () => {
    expect(truncateMiddleParts(address)).toEqual({ start: '0x0faa', end: '174264' })
  })

  it('returns short values untouched', () => {
    expect(truncateMiddleParts('0xabcdef')).toEqual({ start: '0xabcdef', end: null })
  })

  it('does not count 0x for values without the prefix', () => {
    expect(truncateMiddleParts('abcdefghijklmnop', 4, 6)).toEqual({
      start: 'abcd',
      end: 'klmnop',
    })
  })

  it('is used by the address and hash helpers', () => {
    expect(truncateStakeAddress(address)).toBe('0x0faa...174264')
    expect(formatTxHashShort(`0x${'ab'.repeat(32)}`)).toBe('0xabab...ababab')
  })
})

describe('formatCountdown', () => {
  it.each([
    [0, 'Ready'],
    [-5, 'Ready'],
    [45, '45s'],
    [125, '2m 5s'],
    [3_725, '1h 2m 5s'],
    [90_061, '1d 1h 1m'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected)
  })
})

describe('formatUnstakingDelayStat', () => {
  it('uses the countdown format under a day', () => {
    expect(formatUnstakingDelayStat(3_600n)).toBe('1h 0m 0s')
  })

  it('formats whole days', () => {
    expect(formatUnstakingDelayStat(7n * 86_400n)).toBe('7 days')
  })

  it('rounds fractional days to one decimal', () => {
    expect(formatUnstakingDelayStat(129_600n)).toBe('1.5 days')
  })

  it('returns a dash for negative values', () => {
    expect(formatUnstakingDelayStat(-1n)).toBe('—')
  })
})

describe('formatUnstakingDelayCompact', () => {
  it('uses the short day suffix', () => {
    expect(formatUnstakingDelayCompact(7n * 86_400n)).toBe('7d')
    expect(formatUnstakingDelayCompact(129_600n)).toBe('1.5d')
  })
})

describe('formatCooldownForBlurb', () => {
  it.each([
    [0n, ''],
    [30n, '30-second'],
    [90n, '2-minute'],
    [5_400n, '2-hour'],
    [7n * 86_400n, '7-day'],
    [129_600n, '1.5-day'],
  ])('formats %s seconds as %j', (seconds, expected) => {
    expect(formatCooldownForBlurb(seconds)).toBe(expected)
  })
})

describe('formatDurationFromSeconds', () => {
  it.each([
    [0, '—'],
    [Number.NaN, '—'],
    [59, '59 s'],
    [125, '2 min'],
    [3_600, '1 h'],
    [3_660, '1 h 1 min'],
    [86_400, '1 d'],
    [90_000, '1 d 1 h'],
  ])('formats %d seconds as %s', (seconds, expected) => {
    expect(formatDurationFromSeconds(seconds)).toBe(expected)
  })
})
