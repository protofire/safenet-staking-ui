import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TxCheckNotice } from '@/components/ui/tx-check-notice'
import { TxDialog } from '@/components/ui/tx-dialog'
import { useClaimRewards, useClaimRewardsSimulation } from '@/hooks/useClaimRewards'
import type { usePortfolioRewardsModels } from '@/hooks/usePortfolioRewardsModels'
import { useResetOnWalletChange } from '@/hooks/useResetOnWalletChange'
import { useSafeQueuedToast } from '@/hooks/useSafeQueuedToast'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { useTxSuccessNotify } from '@/hooks/useTxSuccessNotify'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatTokenAmount } from '@/lib/format'
import { resolveTxProgressPhase } from '@/lib/txProgress'

type ClaimRewardsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: ReturnType<typeof usePortfolioRewardsModels>
}

export function ClaimRewardsDialog({ open, onOpenChange, model }: ClaimRewardsDialogProps) {
  const { address } = useAccount()
  const { walletReady } = useWalletReady()
  const { rewards, proof, loading: rewardsLoading, isError: rewardsError } = model
  const {
    claimRewards,
    isSigningTx,
    isConfirmingTx,
    isSafeQueued,
    isSuccess,
    error,
    reset,
    txHash,
  } = useClaimRewards()
  const claimedAmountRef = useRef(0n)
  const [claimedAmountDisplay, setClaimedAmountDisplay] = useState(0n)
  const txBusy = isSigningTx || isConfirmingTx || isSafeQueued || isSuccess
  const claimSimulation = useClaimRewardsSimulation(
    address && proof?.proof?.length
      ? {
          account: address,
          cumulativeAmount: BigInt(proof.cumulativeAmount),
          expectedMerkleRoot: proof.merkleRoot,
          merkleProof: proof.proof,
        }
      : undefined,
    walletReady && !rewardsLoading && rewards.canClaim && !txBusy,
  )

  const resetDialogState = useCallback(() => {
    reset()
    claimedAmountRef.current = 0n
    setClaimedAmountDisplay(0n)
  }, [reset])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetDialogState()
      onOpenChange(next)
    },
    [onOpenChange, resetDialogState],
  )

  useTxSuccessNotify(isSuccess, () => {
    toast.success('Rewards received', {
      description: `${formatTokenAmount(claimedAmountRef.current)} SAFE was sent to your wallet.`,
    })
  })
  useSafeQueuedToast(isSafeQueued)
  useTxErrorToast(error, 'Rewards claim did not go through')
  useResetOnWalletChange(() => handleOpenChange(false))

  function handleClaim() {
    if (!address || !proof?.proof?.length || !walletReady) return
    const amount = rewards.claimable
    claimedAmountRef.current = amount
    setClaimedAmountDisplay(amount)
    claimRewards(address, BigInt(proof.cumulativeAmount), proof.merkleRoot, proof.proof)
  }

  const progress = txBusy
    ? {
        phase: resolveTxProgressPhase({ isSuccess, isSafeQueued, isSigning: isSigningTx }),
        txHash,
        description: isSuccess
          ? `Claimed ${formatTokenAmount(claimedAmountDisplay)} SAFE to your wallet.`
          : undefined,
      }
    : null

  if (rewardsError) {
    return (
      <TxDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Claim staking rewards"
        cancelLabel="Close"
      >
        <p className="m-0 text-sm text-danger" role="alert">
          Failed to load reward data. Close and try again from the portfolio page.
        </p>
      </TxDialog>
    )
  }

  return (
    <TxDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Claim staking rewards"
      progress={progress}
      dismissLocked={isSigningTx}
      cancelDisabled={txBusy}
      actions={
        <Button
          type="button"
          className="font-semibold"
          disabled={rewardsLoading || !rewards.canClaim || !walletReady}
          onClick={handleClaim}
        >
          Claim rewards
        </Button>
      }
    >
      <p className="m-0 text-sm leading-relaxed text-text-muted">
        Claim the SAFE amount below to your wallet after you confirm.
      </p>
      <div className="rounded-md border border-border-faint bg-bg-sunken p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="eyebrow">Claimable</span>
          {rewardsLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-text">
              {formatTokenAmount(rewards.claimable)}
              <span className="ml-1.5 text-xs font-normal text-text-muted">SAFE</span>
            </span>
          )}
        </div>
      </div>
      <TxCheckNotice simulation={claimSimulation} />
    </TxDialog>
  )
}
