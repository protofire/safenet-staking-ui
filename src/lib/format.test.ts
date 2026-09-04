import { describe, expect, it } from 'vitest'

import {
  formatAmountInputDisplay,
  formatCooldownForBlurb,
  formatCountdown,
  formatDurationFromSeconds,
  formatTokenAmount,
  formatTokenAmountRaw,
  formatTxHashShort,
  formatUnstakingDelayCompact,
  formatUnstakingDelayStat,
  isValidAmountInput,
  safeParseEther,
  truncateMiddleParts,
  truncateStakeAddress,
} from './format'

const SAFE = 10n ** 18n

describe('formatTokenAmountRaw', () => {
  it('formats whole token amounts without decimals', () => {
    expect(formatTokenAmountRaw(1_000n * SAFE)).toBe('1000')
  })

  it('truncates rather than rounds to maxDecimals', () => {
    expect(formatTokenAmountRaw(1_23456789n * 10n ** 10n)).toBe('1.2345')
  })

  it('drops the fractional part when maxDecimals is 0', () => {
    expect(formatTokenAmountRaw(15n * 10n ** 17n, 18, 0)).toBe('1')
  })

  it('respects custom token decimals', () => {
    expect(formatTokenAmountRaw(1_500_000n, 6)).toBe('1.5')
  })
})

describe('formatTokenAmount', () => {
  it('adds thousands separators', () => {
    expect(formatTokenAmount(1_234_567n * SAFE)).toBe('1,234,567')
  })

  it('keeps separators only in the whole part', () => {
    expect(formatTokenAmount(123_456_789n * 10n ** 16n)).toBe('1,234,567.89')
  })

  it('formats zero', () => {
    expect(formatTokenAmount(0n)).toBe('0')
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
