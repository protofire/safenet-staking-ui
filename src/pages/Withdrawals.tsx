import { useMemo } from 'react'
import { useBlock } from 'wagmi'

import { ConnectWalletPrompt } from '@/components/layout/ConnectWalletPrompt'
import { WithdrawalQueueSkeleton } from '@/components/ui/states'
import { ClaimHeaderActions } from '@/components/withdrawals/ClaimHeaderActions'
import { ClaimWithdrawalDialog } from '@/components/withdrawals/ClaimWithdrawalDialog'
import { WithdrawalQueueEmpty } from '@/components/withdrawals/WithdrawalQueueEmpty'
import { WithdrawalQueueRow } from '@/components/withdrawals/WithdrawalQueueRow'
import { chain } from '@/config/chains'
import { useWithdrawDelay } from '@/hooks/useStakingReads'
import { useWalletReady } from '@/hooks/useWalletReady'
import { useWithdrawalClaims } from '@/hooks/useWithdrawalClaims'
import { useUserPendingWithdrawals } from '@/hooks/useWithdrawals'
import { formatCooldownForBlurb } from '@/lib/format'
import { consecutiveMatureCount } from '@/lib/withdrawals'

export default function Withdrawals() {
  const { isConnected, address } = useWalletReady()
  const { data: block } = useBlock({ chainId: chain.id, watch: true })

  const { data: withdrawDelay } = useWithdrawDelay()
  const { data: rawQueue, isPending, isFetching, isError, error } = useUserPendingWithdrawals()

  const queue = useMemo(() => {
    if (!rawQueue?.length) return []
    return rawQueue.filter((w) => w.amount > 0n)
  }, [rawQueue])

  const withdrawDelayBn = withdrawDelay ?? 0n

  const maturePrefix = useMemo(() => {
    if (!queue.length || block?.timestamp === undefined) return 0
    return consecutiveMatureCount(queue, block.timestamp)
  }, [queue, block])

  const claims = useWithdrawalClaims({
    queue,
    maturePrefix,
    canClaim: isConnected && !!address,
  })

  const cooldownPhrase = withdrawDelayBn ? formatCooldownForBlurb(withdrawDelayBn) : null

  const claimHeaderActions = (
    <ClaimHeaderActions
      maturePrefix={maturePrefix}
      prefersBatchClaim={claims.prefersBatchClaim}
      batchDisabled={claims.batchDisabled}
      singleDisabled={claims.singleDisabled}
      onClaim={claims.openClaimDialog}
    />
  )

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-6 py-8 pb-32 md:pb-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <header className="max-w-narrow">
          <h1>Withdrawal queue</h1>
          <p className="mt-2 max-w-prose text-base leading-relaxed text-text-muted">
            Withdrawals are released after
            {cooldownPhrase ? ` a ${cooldownPhrase}` : ''} unstaking cooldown.
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
        <WithdrawalQueueEmpty cooldownPhrase={cooldownPhrase} />
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
                isBusyClaim={claims.isBusyClaim}
                isBusyBatch={claims.isBusyBatch}
                onClaimSingle={() => claims.openClaimDialog('single')}
              />
            </div>
          ))}
        </div>
      )}

      {claims.dialogProps ? <ClaimWithdrawalDialog {...claims.dialogProps} /> : null}

      {isConnected ? (
        <div className="fixed inset-x-0 bottom-mobile-tab-bar z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <div className="mx-auto flex max-w-page flex-col items-stretch gap-1.5">
            {claimHeaderActions}
          </div>
        </div>
      ) : null}
    </main>
  )
}
