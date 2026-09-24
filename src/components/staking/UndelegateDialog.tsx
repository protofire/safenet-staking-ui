import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Address } from 'viem'

import { TokenAmountField } from '@/components/staking/TokenAmountField'
import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { TxCheckNotice } from '@/components/ui/tx-check-notice'
import { TxDialog } from '@/components/ui/tx-dialog'
import { useResetOnWalletChange } from '@/hooks/useResetOnWalletChange'
import { useSafeQueuedToast } from '@/hooks/useSafeQueuedToast'
import { useUserStakeOnValidator, useWithdrawDelay } from '@/hooks/useStakingReads'
import { useInitiateWithdrawal, useInitiateWithdrawalSimulation } from '@/hooks/useStakingWrites'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { useTxSuccessNotify } from '@/hooks/useTxSuccessNotify'
import { useValidators } from '@/hooks/useValidators'
import { useWalletReady } from '@/hooks/useWalletReady'
import { useUserPendingWithdrawals } from '@/hooks/useWithdrawals'
import {
  formatTokenAmount,
  formatUnstakingDelayCompact,
  safeParseEther,
  truncateStakeAddress,
} from '@/lib/format'
import { resolveTxProgressPhase } from '@/lib/txProgress'

type UndelegateDialogProps = {
  validator: Address
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UndelegateDialog({ validator, open, onOpenChange }: UndelegateDialogProps) {
  const [amount, setAmount] = useState('')
  const { walletReady, wrongNetwork } = useWalletReady()
  const parsedAmount = safeParseEther(amount)

  const { data: validators } = useValidators()
  const validatorLabel = useMemo(() => {
    const v = validators?.find((x) => x.address.toLowerCase() === validator.toLowerCase())
    return v?.label ?? truncateStakeAddress(validator)
  }, [validators, validator])

  const { data: rawQueue } = useUserPendingWithdrawals()
  const queueLength = useMemo(() => {
    if (!rawQueue?.length) return 0
    return rawQueue.filter((w) => w.amount > 0n).length
  }, [rawQueue])

  const {
    initiateWithdrawal,
    isSigningTx,
    isConfirmingTx,
    isSuccess,
    isSafeQueued,
    error: txError,
    reset,
    txHash,
  } = useInitiateWithdrawal()

  const { data: withdrawDelay } = useWithdrawDelay()
  const { data: stakeWei } = useUserStakeOnValidator(validator)

  const staked = stakeWei !== undefined && typeof stakeWei === 'bigint' ? stakeWei : undefined
  const hasStake = staked !== undefined && staked > 0n
  const insufficientStaked = staked !== undefined && parsedAmount > 0n && parsedAmount > staked

  const canUndelegate =
    walletReady && hasStake && parsedAmount > 0n && staked !== undefined && parsedAmount <= staked

  const stakedLabel = staked !== undefined ? formatTokenAmount(staked) : '—'

  const submitting = isSigningTx || isConfirmingTx || isSafeQueued || isSuccess
  const withdrawalSimulation = useInitiateWithdrawalSimulation(
    validator,
    parsedAmount,
    canUndelegate && !submitting,
  )

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setAmount('')
        reset()
      }
      onOpenChange(next)
    },
    [onOpenChange, reset],
  )

  useSafeQueuedToast(isSafeQueued)
  useResetOnWalletChange(() => handleOpenChange(false))
  useTxSuccessNotify(isSuccess, () => {
    toast.success('Unstaking started', {
      description: `${amount || '0'} SAFE queued after ${validatorLabel}. Claim from Withdrawals when the cooldown ends.`,
    })
  })
  useTxErrorToast(txError, 'Unstaking failed')

  const progress = submitting
    ? {
        phase: resolveTxProgressPhase({ isSuccess, isSafeQueued, isSigning: isSigningTx }),
        txHash,
        description: isSuccess
          ? `${amount || '0'} SAFE is queued to unstake from ${validatorLabel}.`
          : undefined,
      }
    : null

  return (
    <TxDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Unstake from ${validatorLabel}`}
      progress={progress}
      dismissLocked={isSigningTx}
      cancelDisabled={submitting}
      actions={
        <Button
          type="button"
          variant="default"
          className="font-semibold"
          disabled={!canUndelegate || submitting}
          onClick={() => initiateWithdrawal(validator, parsedAmount)}
        >
          Start cooldown
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Validator</span>
        <div className="rounded-md border border-border bg-bg-sunken px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-text">{validatorLabel}</span>
            <AddressMono value={validator} compact className="-ml-0.5 justify-start text-left" />
          </div>
        </div>
      </div>

      <TokenAmountField
        inputId="undelegate-amount"
        hintId="undelegate-hint"
        value={amount}
        onChange={setAmount}
        disabled={!hasStake || wrongNetwork}
        invalid={insufficientStaked}
        {...(staked !== undefined ? { maxAmount: staked } : {})}
        maxDisabled={!hasStake || staked === undefined || wrongNetwork}
        hintLabel="Your stake"
        hintValue={stakedLabel}
        {...(insufficientStaked ? { errorMessage: 'Exceeds your stake.' } : {})}
      />

      <TxCheckNotice simulation={withdrawalSimulation} />

      {!hasStake && (
        <p className="text-sm text-text-muted">You have no SAFE delegated with this validator.</p>
      )}

      {hasStake && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border bg-bg-sunken">
            <UnstakeDisclosureStripCell
              k="Cooldown"
              v={withdrawDelay !== undefined ? formatUnstakingDelayCompact(withdrawDelay) : '—'}
              warn
            />
            <UnstakeDisclosureStripCell k="Rewards" v="Paused" />
            <UnstakeDisclosureStripCell k="Withdrawal Queue" v={`#${queueLength + 1}`} last />
          </div>
          <p className="m-0 text-xs leading-relaxed text-text-muted">
            Funds lock and aren&apos;t transferable during cooldown. The withdrawal joins the FIFO
            queue — earlier matured withdrawals clear first.
          </p>
        </div>
      )}
    </TxDialog>
  )
}

function UnstakeDisclosureStripCell({
  k,
  v,
  warn,
  last,
}: {
  k: string
  v: string
  warn?: boolean
  last?: boolean
}) {
  return (
    <div className={'px-3.5 py-2.5 ' + (last ? '' : 'border-r border-border-faint')}>
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-subtle">{k}</div>
      <div
        className={
          'mt-1 font-mono text-[15px] tabular-nums ' + (warn ? 'text-warning' : 'text-text')
        }
      >
        {v}
      </div>
    </div>
  )
}
