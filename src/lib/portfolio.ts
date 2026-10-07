import type { ValidatorInfo } from '@/hooks/useValidators'
import { chartSegmentColor, type ChartTheme } from '@/lib/chartColors'

export type PositionRow = {
  address: `0x${string}`
  label: string
  commissionPct: number
  participationPct: number
  stake: bigint
  color: string
}

type StakeRead = { status: string; result?: unknown }

export function sumPendingWei(entries: readonly { amount: bigint }[] | undefined): bigint {
  if (!entries?.length) return 0n
  return entries.reduce((acc, e) => acc + e.amount, 0n)
}

export function countCoolingDown(
  queue: readonly { claimableAt: bigint }[],
  nowSec: bigint | undefined,
): number | null {
  if (queue.length === 0) return 0
  if (nowSec === undefined) return null
  return queue.filter((w) => nowSec < w.claimableAt).length
}

export function stakeSharePct(stake: bigint, total: bigint): number {
  return total > 0n ? Number((stake * 10000n) / total) / 100 : 0
}

export function conicGradientFromSegments(
  parts: { stake: bigint; color: string }[],
  total: bigint,
): string {
  if (total <= 0n || parts.length === 0) return 'transparent'
  let offset = 0
  const stops: string[] = []
  for (const p of parts) {
    const start = offset
    offset += stakeSharePct(p.stake, total)
    stops.push(`${p.color} ${start}% ${offset}%`)
  }
  return `conic-gradient(from -90deg, ${stops.join(', ')})`
}

export function buildPositions(
  validators: readonly ValidatorInfo[] | undefined,
  stakeReads: readonly StakeRead[] | undefined,
  theme: ChartTheme,
): PositionRow[] {
  if (!validators || !stakeReads) return []
  const rows = validators.flatMap((v, i) => {
    const r = stakeReads[i]
    if (r?.status !== 'success' || typeof r.result !== 'bigint' || r.result <= 0n) return []
    return [
      {
        address: v.address,
        label: v.label,
        commissionPct: v.commission * 100,
        participationPct: v.participationRate14d * 100,
        stake: r.result,
      },
    ]
  })
  rows.sort((a, b) => (a.stake > b.stake ? -1 : a.stake < b.stake ? 1 : 0))
  return rows.map((row, i) => ({ ...row, color: chartSegmentColor(i, rows.length, theme) }))
}
