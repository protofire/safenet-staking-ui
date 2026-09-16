import { formatUnits, parseEther } from 'viem'

const LOCALE = 'en-US'
const FLOOR_DECIMALS = 5
const DISPLAY_FLOOR_LABEL = '< 0.00001'
const COMPACT_THRESHOLD = 1_000_000

type TierDecimals = 5 | 4 | 2

const numberFormat = (maximumFractionDigits: number) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits })
const tierNumberFormats: Record<TierDecimals, Intl.NumberFormat> = {
  5: numberFormat(5),
  4: numberFormat(4),
  2: numberFormat(2),
}
const compactNumberFormat = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
})

function tierDecimals(amount: bigint, scale: bigint): TierDecimals {
  if (amount < scale) return 5
  if (amount < 1_000n * scale) return 4
  return 2
}

function roundToPrecision(amount: bigint, decimals: number, precision: number): string {
  if (precision >= decimals) return formatUnits(amount, decimals)
  const factor = 10n ** BigInt(decimals - precision)
  return formatUnits((amount + factor / 2n) / factor, precision)
}

export function formatTokenAmountPrecise(
  amount: bigint,
  decimals = 18,
  precision?: number,
): string {
  const units =
    precision === undefined
      ? formatUnits(amount, decimals)
      : roundToPrecision(amount, decimals, precision)
  return formatAmountInputDisplay(units)
}

export function formatTokenAmount(amount: bigint, decimals = 18, precision?: number): string {
  if (precision !== undefined) return formatTokenAmountPrecise(amount, decimals, precision)

  const scale = 10n ** BigInt(decimals)
  if (amount > 0n && amount * 10n ** BigInt(FLOOR_DECIMALS) < scale) return DISPLAY_FLOOR_LABEL

  const tier = tierDecimals(amount, scale)
  const n = Number(roundToPrecision(amount, decimals, tier))
  return n >= COMPACT_THRESHOLD ? compactNumberFormat.format(n) : tierNumberFormats[tier].format(n)
}

export function sanitizeAmountInput(value: string): string {
  return value.replace(/,/g, '')
}

export function formatAmountInputDisplay(value: string): string {
  const sanitized = sanitizeAmountInput(value)
  if (!sanitized) return ''

  const dotIndex = sanitized.indexOf('.')
  const whole = dotIndex === -1 ? sanitized : sanitized.slice(0, dotIndex)
  const decimal = dotIndex === -1 ? undefined : sanitized.slice(dotIndex + 1)
  const delimitedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (dotIndex === -1) return delimitedWhole
  if (sanitized.endsWith('.')) return `${delimitedWhole}.`
  return `${delimitedWhole}.${decimal ?? ''}`
}

const AMOUNT_INPUT_PATTERN = /^[0-9]*\.?[0-9]*$/

export function isValidAmountInput(value: string): boolean {
  return AMOUNT_INPUT_PATTERN.test(sanitizeAmountInput(value))
}

export function safeParseEther(amount: string): bigint {
  try {
    const cleaned = sanitizeAmountInput(amount)
    return cleaned ? parseEther(cleaned) : 0n
  } catch {
    return 0n
  }
}

export function truncateStakeAddress(address: string): string {
  return truncateMiddle(address, 4, 6)
}

const ELLIPSIS = '...'

export function truncateMiddleParts(
  value: string,
  lead = 4,
  tail = 6,
): { start: string; end: string | null } {
  const prefixLen = value.startsWith('0x') ? 2 + lead : lead
  if (value.length <= prefixLen + tail + ELLIPSIS.length) {
    return { start: value, end: null }
  }
  return {
    start: value.slice(0, prefixLen),
    end: value.slice(-tail),
  }
}

function truncateMiddle(value: string, lead = 4, tail = 6): string {
  const { start, end } = truncateMiddleParts(value, lead, tail)
  return end === null ? start : `${start}${ELLIPSIS}${end}`
}

export function formatTxHashShort(hash: string): string {
  return truncateMiddle(hash, 4, 6)
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Ready'
  const d = Math.floor(seconds / 86_400)
  const h = Math.floor((seconds % 86_400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatUnstakingDelayStat(seconds: bigint): string {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s < 0) return '—'
  if (s < 86_400) return formatCountdown(s)
  const days = s / 86_400
  if (Number.isInteger(days)) return `${days} days`
  const rounded = Math.round(days * 10) / 10
  return `${rounded} days`
}

export function formatUnstakingDelayCompact(seconds: bigint): string {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s < 0) return '—'
  if (s < 86_400) return formatCountdown(s)
  const days = s / 86_400
  if (Number.isInteger(days)) return `${days}d`
  const rounded = Math.round(days * 10) / 10
  return `${rounded}d`
}

export function formatCooldownForBlurb(seconds: bigint): string {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0) return ''
  if (s < 60) return `${s}-second`
  if (s < 3600) {
    const m = Math.max(1, Math.round(s / 60))
    return `${m}-minute`
  }
  if (s < 86_400) {
    const h = Math.max(1, Math.round(s / 3600))
    return `${h}-hour`
  }
  const days = s / 86_400
  if (Number.isInteger(days)) return `${days}-day`
  const rounded = Math.round(days * 10) / 10
  return `${rounded}-day`
}

export function formatDurationFromSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—'
  const s = Math.floor(totalSeconds)
  if (s < 60) return `${s} s`
  if (s < 3600) {
    const m = Math.floor(s / 60)
    return `${m} min`
  }
  if (s < 86_400) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return m > 0 ? `${h} h ${m} min` : `${h} h`
  }
  const d = Math.floor(s / 86_400)
  const h = Math.floor((s % 86_400) / 3600)
  return h > 0 ? `${d} d ${h} h` : `${d} d`
}
