import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useBlock } from 'wagmi'

import { ConnectWalletPrompt } from '@/components/layout/ConnectWalletPrompt'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { ProgressBar } from '@/components/ui/progress-bar'
import { WithdrawalQueueSkeleton } from '@/components/ui/states'
import { ClaimWithdrawalDialog } from '@/components/withdrawals/ClaimWithdrawalDialog'
import { chain } from '@/config/chains'
import { useResetOnWalletChange } from '@/hooks/useResetOnWalletChange'
import { useSafeQueuedToast } from '@/hooks/useSafeQueuedToast'
import { useWithdrawDelay } from '@/hooks/useStakingReads'
import {
  useBatchClaimWithdrawals,
  useClaimWithdrawal,
  useClaimWithdrawalSimulation,
} from '@/hooks/useStakingWrites'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { IDLE_SIMULATION } from '@/hooks/useTxSimulation'
import { useTxSuccessNotify } from '@/hooks/useTxSuccessNotify'
import { useWalletReady } from '@/hooks/useWalletReady'
import { useUserPendingWithdrawals } from '@/hooks/useWithdrawals'
import {
  formatCooldownForBlurb,
  formatCountdown,
  formatTokenAmount,
  formatTxHashShort,
} from '@/lib/format'
import { cn } from '@/lib/utils'

type QueueEntry = { amount: bigint; claimableAt: bigint }

function consecutiveMatureCount(queue: QueueEntry[], nowSec: bigint): number {
  let k = 0
  while (k < queue.length) {
    const entry = queue[k]
    if (!entry || nowSec < entry.claimableAt) break
    k += 1
  }
  return k
}

function cooldownProgressPct(
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

function formatClaimableAt(ts: bigint): string {
  const ms = Number(ts) * 1000
  if (!Number.isFinite(ms)) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(ms),
  )
}

function initiatedTimestamp(claimableAt: bigint, withdrawDelaySec: bigint): bigint {
  if (withdrawDelaySec <= 0n) return claimableAt
  return claimableAt - withdrawDelaySec
}

function WithdrawalQueueRow({
  w,
  idx,
  isHead,
  isLast,
  now,
  withdrawDelayBn,
  maturePrefix,
  walletSupportsAtomicBatch,
  isBusyClaim,
  isBusyBatch,
  onClaimSingle,
}: {
  w: QueueEntry
  idx: number
  isHead: boolean
  isLast: boolean
  now: bigint
  withdrawDelayBn: bigint
  maturePrefix: number
  walletSupportsAtomicBatch: boolean | undefined
  isBusyClaim: boolean
  isBusyBatch: boolean
  onClaimSingle: () => void
}) {
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

  const useBatchHint =
    maturePrefix >= 2 && walletSupportsAtomicBatch === true && isHead && timeReady
  const showRowClaim =
    isHead &&
    timeReady &&
    maturePrefix >= 1 &&
    !(maturePrefix >= 2 && walletSupportsAtomicBatch === true) &&
    !isBusyBatch

  const initiated = initiatedTimestamp(w.claimableAt, withdrawDelayBn)

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
          <span
            className={cn(
              'font-mono text-sm font-medium tabular-nums',
              isHead ? 'text-text' : 'text-text-muted',
            )}
            aria-label={`Queue position ${idx + 1}`}
          >
            #{idx + 1}
          </span>
          <div className="min-w-0 text-right font-mono text-sm tabular-nums text-text">
            <span className="whitespace-nowrap">{formatTokenAmount(w.amount)}</span>
            <span className="ml-1 font-normal text-text-muted">SAFE</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Initiated</span>
          <span className="font-mono text-xs tabular-nums text-text">
            {formatClaimableAt(initiated)}
          </span>
          <span className="font-mono text-xs tabular-nums text-text-muted">
            Claimable {formatClaimableAt(w.claimableAt)}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">{statusLine}</span>
            <span className="whitespace-nowrap font-mono text-xs tabular-nums text-text-muted">
              {pct}%
            </span>
          </div>
          <ProgressBar pct={pct} ready={timeReady} />
          <div>
            {timeReady ? (
              <Pill tone="success">Ready</Pill>
            ) : (
              <Pill tone="warning">Cooling down</Pill>
            )}
          </div>
        </div>

        <div className="pt-1">
          {showRowClaim ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-11 w-full font-medium md:h-8"
              disabled={isBusyClaim}
              onClick={onClaimSingle}
            >
              {isBusyClaim ? 'Claiming…' : 'Claim'}
            </Button>
          ) : useBatchHint ? (
            <span className="text-xs text-text-muted">Use batch above</span>
          ) : !timeReady ? (
            <span className="text-xs text-text-muted">—</span>
          ) : !isHead ? (
            <span className="text-xs text-text-muted">Claim previous first</span>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </div>
      </div>

      <div
        className="hidden items-center gap-5 md:grid"
        style={{
          gridTemplateColumns: '52px minmax(0,1fr) minmax(0,1fr) minmax(0,2fr) 140px',
        }}
      >
        <span
          className={cn(
            'font-mono text-base font-medium tabular-nums',
            isHead ? 'text-text' : 'text-text-muted',
          )}
          aria-label={`Queue position ${idx + 1}`}
        >
          #{idx + 1}
        </span>

        <div className="min-w-0 text-right font-mono text-sm tabular-nums text-text">
          <span className="whitespace-nowrap">{formatTokenAmount(w.amount)}</span>
          <span className="ml-1 font-normal text-text-muted">SAFE</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="eyebrow">Initiated</span>
          <span className="font-mono text-xs tabular-nums text-text">
            {formatClaimableAt(initiated)}
          </span>
          <span className="font-mono text-xs tabular-nums text-text-muted">
            Claimable {formatClaimableAt(w.claimableAt)}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">{statusLine}</span>
            <span className="whitespace-nowrap font-mono text-xs tabular-nums text-text-muted">
              {pct}%
            </span>
          </div>
          <ProgressBar pct={pct} ready={timeReady} />
          <div>
            {timeReady ? (
              <Pill tone="success">Ready</Pill>
            ) : (
              <Pill tone="warning">Cooling down</Pill>
            )}
          </div>
        </div>

        <div className="text-right">
          {showRowClaim ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 font-medium"
              disabled={isBusyClaim}
              onClick={onClaimSingle}
            >
              {isBusyClaim ? 'Claiming…' : 'Claim'}
            </Button>
          ) : useBatchHint ? (
            <span className="text-xs text-text-muted">Use batch above</span>
          ) : !timeReady ? (
            <span className="text-xs text-text-muted">—</span>
          ) : !isHead ? (
            <span className="text-xs text-text-muted">Claim previous first</span>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Withdrawals() {
  const navigate = useNavigate()
  const { isConnected, address } = useWalletReady()
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [claimDialogMode, setClaimDialogMode] = useState<'single' | 'batch' | null>(null)
  const closeClaimDialog = useCallback(() => {
    setClaimDialogOpen(false)
    setClaimDialogMode(null)
  }, [])
  const { data: block } = useBlock({ chainId: chain.id, watch: true })

  const { data: withdrawDelay } = useWithdrawDelay()
  const { data: rawQueue, isPending, isFetching, isError, error } = useUserPendingWithdrawals()

  const {
    claimWithdrawal,
    isSigningTx: isClaimSigning,
    isConfirmingTx: isClaimConfirming,
    isSuccess: isClaimOk,
    isSafeQueued: isClaimSafeQueued,
    error: claimError,
    reset: resetClaim,
    txHash: claimTxHash,
  } = useClaimWithdrawal()

  const {
    batchClaimWithdrawals,
    supportsBatching: walletSupportsAtomicBatch,
    isSigningTx: isBatchSigning,
    isConfirmingTx: isBatchConfirming,
    isSuccess: isBatchOk,
    isSafeQueued: isBatchSafeQueued,
    error: batchError,
    reset: resetBatch,
    txHash: batchTxHash,
  } = useBatchClaimWithdrawals()

  const queue = useMemo(() => {
    if (!rawQueue?.length) return []
    return rawQueue.filter((w) => w.amount > 0n)
  }, [rawQueue])

  const withdrawDelayBn = withdrawDelay ?? 0n

  const maturePrefix = useMemo(() => {
    if (!queue.length || block?.timestamp === undefined) return 0
    return consecutiveMatureCount(queue, block.timestamp)
  }, [queue, block])
  useSafeQueuedToast(isClaimSafeQueued)

  useResetOnWalletChange(() => {
    resetClaim()
    resetBatch()
    closeClaimDialog()
  })

  useTxSuccessNotify(isClaimOk, () => {
    toast.success('Withdrawal claimed', {
      description: claimTxHash ? formatTxHashShort(claimTxHash) : undefined,
    })
  })

  useTxSuccessNotify(isBatchOk, () => {
    toast.success('Withdrawals claimed', {
      description: batchTxHash ? formatTxHashShort(batchTxHash) : undefined,
    })
  })

  useTxErrorToast(claimError, 'Claim failed')
  useTxErrorToast(batchError, 'Batch claim failed')

  const cooldownPhrase = withdrawDelayBn ? formatCooldownForBlurb(withdrawDelayBn) : null

  const isBusyClaim = isClaimSigning || isClaimConfirming
  const isBusyBatch = isBatchSigning || isBatchConfirming

  const claimDialogTotalWei = useMemo(() => {
    if (!claimDialogMode || maturePrefix < 1) return 0n
    if (claimDialogMode === 'single') return queue[0]?.amount ?? 0n
    let s = 0n
    for (let i = 0; i < maturePrefix && i < queue.length; i++) s += queue[i]!.amount
    return s
  }, [claimDialogMode, maturePrefix, queue])

  const [claimSnapshot, setClaimSnapshot] = useState({ totalWei: 0n, count: 0 })

  const claimDialogSigning =
    claimDialogMode === 'single'
      ? isClaimSigning
      : claimDialogMode === 'batch'
        ? isBatchSigning
        : false
  const claimDialogConfirming =
    claimDialogMode === 'single'
      ? isClaimConfirming
      : claimDialogMode === 'batch'
        ? isBatchConfirming
        : false
  const claimDialogTxHash =
    claimDialogMode === 'single'
      ? claimTxHash
      : claimDialogMode === 'batch'
        ? batchTxHash
        : undefined

  const claimDialogSucceeded =
    claimDialogMode === 'single' ? isClaimOk : claimDialogMode === 'batch' ? isBatchOk : false

  const claimDialogSuccessDescription = claimDialogSucceeded
    ? claimDialogMode === 'batch'
      ? `Claimed ${claimSnapshot.count} withdrawals (${formatTokenAmount(claimSnapshot.totalWei)} SAFE).`
      : `Claimed ${formatTokenAmount(claimSnapshot.totalWei)} SAFE to your wallet.`
    : undefined

  const openClaimDialog = (mode: 'single' | 'batch') => {
    setClaimDialogMode(mode)
    setClaimDialogOpen(true)
  }

  const handleClaimDialogOpenChange = (next: boolean) => {
    if (!next) {
      resetClaim()
      resetBatch()
      setClaimDialogOpen(false)
      setClaimDialogMode(null)
    } else {
      setClaimDialogOpen(true)
    }
  }

  const prefersBatchClaim = maturePrefix >= 2 && walletSupportsAtomicBatch === true

  const batchButtonDisabled =
    !isConnected ||
    !address ||
    maturePrefix < 2 ||
    walletSupportsAtomicBatch !== true ||
    isBusyClaim ||
    isBusyBatch

  const singleHeaderDisabled =
    !isConnected || !address || maturePrefix === 0 || isBusyClaim || isBusyBatch

  const claimDialogSafeQueued = claimDialogMode === 'single' ? isClaimSafeQueued : isBatchSafeQueued
  const claimSimulation = useClaimWithdrawalSimulation(
    claimDialogOpen && claimDialogMode === 'single' && !isBusyClaim && !claimDialogSucceeded,
  )

  const claimHeaderActions = (
    <>
      {prefersBatchClaim ? (
        <Button
          type="button"
          variant="default"
          className="h-11 w-full px-5 text-sm font-semibold tracking-tight md:w-auto"
          disabled={batchButtonDisabled}
          onClick={() => openClaimDialog('batch')}
        >
          Claim {maturePrefix} withdrawals
        </Button>
      ) : (
        <Button
          type="button"
          variant={maturePrefix > 0 ? 'default' : 'secondary'}
          className={cn(
            'h-11 w-full px-5 text-sm font-semibold tracking-tight md:w-auto',
            maturePrefix === 0 && 'pointer-events-none opacity-60',
          )}
          disabled={singleHeaderDisabled}
          onClick={() => openClaimDialog('single')}
        >
          {maturePrefix > 0 ? 'Claim withdrawal' : 'No matured withdrawals'}
        </Button>
      )}
      {maturePrefix >= 2 && walletSupportsAtomicBatch === true && (
        <span className="eyebrow">Batch EIP-5792 supported</span>
      )}
    </>
  )

  return (
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 py-8 pb-32 md:pb-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <header className="max-w-[540px]">
          <h1 className="m-0 text-xl font-semibold tracking-tight text-text md:text-[28px] md:leading-tight">
            Withdrawal queue
          </h1>
          <p className="mt-2 max-w-prose text-base leading-relaxed text-text-muted">
            Withdrawals are released after
            {cooldownPhrase ? ` a ${cooldownPhrase}` : ''} unstaking cooldown. The queue is FIFO —
            only the head withdrawal can be claimed at a time.
          </p>
        </header>
        <div className="hidden shrink-0 flex-col items-start gap-1.5 md:flex md:items-end">
          {claimHeaderActions}
        </div>
      </div>

      {!isConnected && (
        <ConnectWalletPrompt
          variant="inline"
          suffixMessage="to view and claim withdrawals for your address."
          className="mb-6"
        />
      )}

      {isConnected && isError && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {error instanceof Error ? error.message : 'Could not load withdrawal queue.'}
        </p>
      )}

      {isConnected && queue.length === 0 && !isPending && !isError && (
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14">
          <p className="text-sm font-semibold text-text">Your withdrawal queue is empty.</p>
          <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
            Initiate a withdrawal from any validator to start the cooldown
            {cooldownPhrase ? ` (about ${cooldownPhrase})` : ''}.
          </p>
          <Button
            type="button"
            className="mt-6 font-semibold"
            onClick={() => navigate('/validators')}
          >
            Explore validators
          </Button>
        </div>
      )}

      {isConnected &&
        (isPending || (isFetching && queue.length === 0 && rawQueue === undefined)) &&
        !isError && <WithdrawalQueueSkeleton count={4} />}

      {isConnected && queue.length > 0 && !isError && block?.timestamp === undefined && (
        <WithdrawalQueueSkeleton count={queue.length} />
      )}

      {isConnected && queue.length > 0 && !isError && block?.timestamp !== undefined && (
        <div
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface md:overflow-x-auto"
          role="list"
          aria-label="Withdrawal queue"
        >
          {queue.map((w, idx) => (
            <div key={`${w.claimableAt}-${w.amount}`} role="listitem">
              <WithdrawalQueueRow
                w={w}
                idx={idx}
                isHead={idx === 0}
                isLast={idx === queue.length - 1}
                now={block.timestamp}
                withdrawDelayBn={withdrawDelayBn}
                maturePrefix={maturePrefix}
                walletSupportsAtomicBatch={walletSupportsAtomicBatch}
                isBusyClaim={isBusyClaim}
                isBusyBatch={isBusyBatch}
                onClaimSingle={() => openClaimDialog('single')}
              />
            </div>
          ))}
        </div>
      )}
      {claimDialogMode ? (
        <ClaimWithdrawalDialog
          open={claimDialogOpen}
          onOpenChange={handleClaimDialogOpenChange}
          mode={claimDialogMode}
          matureCount={claimDialogSucceeded ? claimSnapshot.count : maturePrefix}
          totalAmountWei={claimDialogSucceeded ? claimSnapshot.totalWei : claimDialogTotalWei}
          isSigning={claimDialogSigning}
          isConfirming={claimDialogConfirming}
          isSafeQueued={claimDialogSafeQueued}
          showSuccess={claimDialogSucceeded}
          {...(claimDialogSuccessDescription !== undefined
            ? { successDescription: claimDialogSuccessDescription }
            : {})}
          txHash={claimDialogTxHash}
          simulation={claimDialogMode === 'single' ? claimSimulation : IDLE_SIMULATION}
          onSubmit={() => {
            setClaimSnapshot({ totalWei: claimDialogTotalWei, count: maturePrefix })
            if (claimDialogMode === 'single') claimWithdrawal()
            else batchClaimWithdrawals(maturePrefix)
          }}
        />
      ) : null}

      {isConnected ? (
        <div className="fixed inset-x-0 bottom-mobile-tab-bar z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <div className="mx-auto flex max-w-[1240px] flex-col items-stretch gap-1.5">
            {claimHeaderActions}
          </div>
        </div>
      ) : null}
    </main>
  )
}
