import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCountdown, formatTokenAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  cooldownProgressPct,
  formatClaimableAt,
  initiatedTimestamp,
  type QueueEntry,
} from '@/lib/withdrawals'

type WithdrawalQueueRowProps = {
  w: QueueEntry
  idx: number
  isHead: boolean
  isLast: boolean
  now: bigint
  withdrawDelayBn: bigint
  maturePrefix: number
  isBusyClaim: boolean
  isBusyBatch: boolean
  onClaimSingle: () => void
}

export function WithdrawalQueueRow({
  w,
  idx,
  isHead,
  isLast,
  now,
  withdrawDelayBn,
  maturePrefix,
  isBusyClaim,
  isBusyBatch,
  onClaimSingle,
}: WithdrawalQueueRowProps) {
  const timeReady = now >= w.claimableAt
  const claimable = isHead && timeReady && maturePrefix >= 1
  const pct = cooldownProgressPct(w.claimableAt, now, withdrawDelayBn)
  let statusLine: string
  if (!timeReady) {
    const remainingSec = Math.max(0, Number(w.claimableAt - now))
    statusLine = formatCountdown(remainingSec)
  } else if (isHead) {
    statusLine = 'Ready to claim'
  } else {
    statusLine = 'Awaiting earlier queue items'
  }

  const position = (sizeClass: string) => (
    <span
      className={cn(
        'font-mono font-medium tabular-nums',
        sizeClass,
        isHead ? 'text-text' : 'text-text-muted',
      )}
      aria-label={`Queue position ${idx + 1}`}
    >
      #{idx + 1}
    </span>
  )

  const amount = (
    <div className="min-w-0 text-right font-mono text-sm tabular-nums text-text">
      <span className="whitespace-nowrap">{formatTokenAmount(w.amount)}</span>
      <span className="ml-1 font-normal text-text-muted">SAFE</span>
    </div>
  )

  const times = (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow">Initiated</span>
      <span className="font-mono text-xs tabular-nums text-text">
        {formatClaimableAt(initiatedTimestamp(w.claimableAt, withdrawDelayBn))}
      </span>
      <span className="font-mono text-xs tabular-nums text-text-muted">
        Claimable {formatClaimableAt(w.claimableAt)}
      </span>
    </div>
  )

  const progress = (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-muted">{statusLine}</span>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-text-muted">
          {pct}%
        </span>
      </div>
      <ProgressBar pct={pct} ready={timeReady} />
      <div>
        {timeReady ? <Pill tone="success">Ready</Pill> : <Pill tone="warning">Cooling down</Pill>}
      </div>
    </div>
  )

  const claimAction = (buttonClassName: string) =>
    claimable ? (
      <Button
        type="button"
        variant="default"
        size="sm"
        className={buttonClassName}
        disabled={isBusyClaim || isBusyBatch}
        onClick={onClaimSingle}
      >
        {isBusyClaim ? 'Claiming…' : 'Claim'}
      </Button>
    ) : (
      <span className="text-xs text-text-muted">
        {timeReady && !isHead ? 'Claim previous first' : '—'}
      </span>
    )

  return (
    <div
      className={cn(
        'border-l-2 px-4 py-4 md:px-5',
        !isLast && 'border-b border-border-faint',
        claimable ? 'border-l-primary bg-brand-soft' : 'border-l-transparent',
      )}
    >
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-baseline justify-between gap-2">
          {position('text-sm')}
          {amount}
        </div>
        {times}
        {progress}
        <div className="pt-1">{claimAction('h-11 w-full font-medium md:h-8')}</div>
      </div>

      <div className="hidden grid-cols-withdrawal-queue items-center gap-5 md:grid">
        {position('text-base')}
        {amount}
        {times}
        {progress}
        <div className="text-right">{claimAction('h-8 font-medium')}</div>
      </div>
    </div>
  )
}
