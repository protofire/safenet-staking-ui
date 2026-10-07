export type QueueEntry = { amount: bigint; claimableAt: bigint }

export function consecutiveMatureCount(queue: QueueEntry[], nowSec: bigint): number {
  let k = 0
  while (k < queue.length) {
    const entry = queue[k]
    if (!entry || nowSec < entry.claimableAt) break
    k += 1
  }
  return k
}

export function cooldownProgressPct(
  claimableAt: bigint,
  nowSec: bigint,
  withdrawDelaySec: bigint,
): number {
  if (withdrawDelaySec <= 0n) return 100
  if (nowSec >= claimableAt) return 100
  const start = claimableAt - withdrawDelaySec
  if (nowSec <= start) return 0
  const elapsed = Number(nowSec - start)
  const total = Number(withdrawDelaySec)
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
}

export function formatClaimableAt(ts: bigint): string {
  const ms = Number(ts) * 1000
  if (!Number.isFinite(ms)) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(ms),
  )
}

export function initiatedTimestamp(claimableAt: bigint, withdrawDelaySec: bigint): bigint {
  if (withdrawDelaySec <= 0n) return claimableAt
  return claimableAt - withdrawDelaySec
}

export function sumMatureAmounts(queue: QueueEntry[], maturePrefix: number): bigint {
  let s = 0n
  for (let i = 0; i < maturePrefix && i < queue.length; i++) s += queue[i]!.amount
  return s
}
