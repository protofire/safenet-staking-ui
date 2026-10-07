import { useCallback, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import type { ClaimWithdrawalDialog } from '@/components/withdrawals/ClaimWithdrawalDialog'
import { useResetOnWalletChange } from '@/hooks/useResetOnWalletChange'
import { useSafeQueuedToast } from '@/hooks/useSafeQueuedToast'
import {
  useBatchClaimWithdrawals,
  useClaimWithdrawal,
  useClaimWithdrawalSimulation,
} from '@/hooks/useStakingWrites'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { IDLE_SIMULATION } from '@/hooks/useTxSimulation'
import { useTxSuccessNotify } from '@/hooks/useTxSuccessNotify'
import { formatTokenAmount, formatTxHashShort } from '@/lib/format'
import { sumMatureAmounts, type QueueEntry } from '@/lib/withdrawals'

type ClaimMode = 'single' | 'batch'

export function useWithdrawalClaims({
  queue,
  maturePrefix,
  canClaim,
}: {
  queue: QueueEntry[]
  maturePrefix: number
  canClaim: boolean
}) {
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [claimDialogMode, setClaimDialogMode] = useState<ClaimMode | null>(null)
  const [claimSnapshot, setClaimSnapshot] = useState({ totalWei: 0n, count: 0 })
  const closeClaimDialog = useCallback(() => {
    setClaimDialogOpen(false)
    setClaimDialogMode(null)
  }, [])

  const single = useClaimWithdrawal()
  const batch = useBatchClaimWithdrawals()

  useSafeQueuedToast(single.isSafeQueued)

  useResetOnWalletChange(() => {
    single.reset()
    batch.reset()
    closeClaimDialog()
  })

  useTxSuccessNotify(single.isSuccess, () => {
    toast.success('Withdrawal received', {
      description: single.txHash ? formatTxHashShort(single.txHash) : undefined,
    })
  })

  useTxSuccessNotify(batch.isSuccess, () => {
    toast.success('Withdrawals received', {
      description: batch.txHash ? formatTxHashShort(batch.txHash) : undefined,
    })
  })

  useTxErrorToast(single.error, 'Withdrawal claim did not go through')
  useTxErrorToast(batch.error, 'Batch withdrawal claim did not go through')

  const isBusyClaim = single.isSigningTx || single.isConfirmingTx
  const isBusyBatch = batch.isSigningTx || batch.isConfirmingTx

  const claimDialogTotalWei =
    !claimDialogMode || maturePrefix < 1
      ? 0n
      : claimDialogMode === 'single'
        ? (queue[0]?.amount ?? 0n)
        : sumMatureAmounts(queue, maturePrefix)

  const active = claimDialogMode === 'single' ? single : claimDialogMode === 'batch' ? batch : null
  const claimDialogSucceeded = active?.isSuccess ?? false

  const claimDialogSuccessDescription = claimDialogSucceeded
    ? claimDialogMode === 'batch'
      ? `Claimed ${claimSnapshot.count} withdrawals (${formatTokenAmount(claimSnapshot.totalWei)} SAFE).`
      : `Claimed ${formatTokenAmount(claimSnapshot.totalWei)} SAFE to your wallet.`
    : undefined

  const claimSimulation = useClaimWithdrawalSimulation(
    claimDialogOpen && claimDialogMode === 'single' && !isBusyClaim && !claimDialogSucceeded,
  )

  const openClaimDialog = (mode: ClaimMode) => {
    setClaimDialogMode(mode)
    setClaimDialogOpen(true)
  }

  const handleClaimDialogOpenChange = (next: boolean) => {
    if (!next) {
      single.reset()
      batch.reset()
      closeClaimDialog()
    } else {
      setClaimDialogOpen(true)
    }
  }

  const supportsBatch = batch.supportsBatching === true
  const prefersBatchClaim = maturePrefix >= 2 && supportsBatch

  const dialogProps: ComponentProps<typeof ClaimWithdrawalDialog> | null = claimDialogMode
    ? {
        open: claimDialogOpen,
        onOpenChange: handleClaimDialogOpenChange,
        mode: claimDialogMode,
        matureCount: claimDialogSucceeded ? claimSnapshot.count : maturePrefix,
        totalAmountWei: claimDialogSucceeded ? claimSnapshot.totalWei : claimDialogTotalWei,
        isSigning: active?.isSigningTx ?? false,
        isConfirming: active?.isConfirmingTx ?? false,
        isSafeQueued: claimDialogMode === 'single' ? single.isSafeQueued : batch.isSafeQueued,
        showSuccess: claimDialogSucceeded,
        ...(claimDialogSuccessDescription !== undefined
          ? { successDescription: claimDialogSuccessDescription }
          : {}),
        txHash: active?.txHash,
        simulation: claimDialogMode === 'single' ? claimSimulation : IDLE_SIMULATION,
        onSubmit: () => {
          setClaimSnapshot({ totalWei: claimDialogTotalWei, count: maturePrefix })
          if (claimDialogMode === 'single') single.claimWithdrawal()
          else batch.batchClaimWithdrawals(maturePrefix)
        },
      }
    : null

  return {
    isBusyClaim,
    isBusyBatch,
    prefersBatchClaim,
    batchDisabled: !canClaim || maturePrefix < 2 || !supportsBatch || isBusyClaim || isBusyBatch,
    singleDisabled: !canClaim || maturePrefix === 0 || isBusyClaim || isBusyBatch,
    openClaimDialog,
    dialogProps,
  }
}
