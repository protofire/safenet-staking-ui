import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Address } from 'viem'

import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { TokenAmountField } from '@/components/staking/TokenAmountField'
import { TxCheckNotice } from '@/components/ui/tx-check-notice'
import { TxDialog } from '@/components/ui/tx-dialog'
import { TxStepper } from '@/components/ui/tx-stepper'
import { useApprovalFlow } from '@/hooks/useApprovalFlow'
import { useBatchStake, useStake, useStakeSimulation } from '@/hooks/useStakingWrites'
import { useResetOnWalletChange } from '@/hooks/useResetOnWalletChange'
import { useSafeQueuedToast } from '@/hooks/useSafeQueuedToast'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { useTxSuccessNotify } from '@/hooks/useTxSuccessNotify'
import { useUserStakeOnValidator, useWithdrawDelay } from '@/hooks/useStakingReads'
import { useValidators } from '@/hooks/useValidators'
import { useWalletReady } from '@/hooks/useWalletReady'
import {
  formatTokenAmount,
  formatUnstakingDelayStat,
  safeParseEther,
  truncateStakeAddress,
} from '@/lib/format'
import { approvalProgressDescription, resolveStakeSteps, stakeStepTitle } from '@/lib/stakeSteps'
import { resolveTxProgressPhase } from '@/lib/txProgress'

type StakeDialogProps = {
  validator: Address
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StakeDialog({ validator, open, onOpenChange }: StakeDialogProps) {
  const [amount, setAmount] = useState('')
  const [showUnlimitedApproval, setShowUnlimitedApproval] = useState(false)
  const { walletReady, wrongNetwork, address } = useWalletReady()
  const { data: balance } = useTokenBalance()
  const parsedAmount = safeParseEther(amount)

  const { data: validators, isError: validatorsError } = useValidators()
  const validatorInfo = useMemo(
    () => validators?.find((x) => x.address.toLowerCase() === validator.toLowerCase()),
    [validators, validator],
  )
  const validatorLabel = validatorInfo?.label ?? truncateStakeAddress(validator)
  const validatorInactive = validatorInfo !== undefined && !validatorInfo.isActive
  const registryLoaded = validators !== undefined
  const validatorUnknown = registryLoaded && validatorInfo === undefined
  const stakeBlocked = !registryLoaded || validatorUnknown || validatorInactive

  const {
    needsApproval,
    approvalType,
    approvedInSession,
    isApprovalPending,
    isSigningApproval,
    isConfirmingApproval,
    isSafeApprovalQueued,
    approveExact,
    approveUnlimited,
    resetApprovalFlow,
    approvalTxHash,
  } = useApprovalFlow(parsedAmount)

  const {
    stake,
    isSigningTx,
    isConfirmingTx,
    isSuccess: isStaked,
    isSafeQueued: isStakeSafeQueued,
    error: stakeError,
    reset: resetStake,
    txHash: stakeTxHash,
  } = useStake()

  const {
    batchApproveAndStake,
    supportsBatching,
    isSigningTx: isBatchSigning,
    isConfirmingTx: isBatchConfirming,
    isSuccess: isBatchSuccess,
    isSafeQueued: isBatchSafeQueued,
    isReverted: isBatchReverted,
    error: batchError,
    reset: resetBatch,
    txHash: batchTxHash,
  } = useBatchStake()

  const { data: withdrawDelay } = useWithdrawDelay()
  const { data: stakeOnValidatorWei } = useUserStakeOnValidator(validator)

  const balanceValue = typeof balance === 'bigint' ? balance : undefined
  const hasZeroBalance = balanceValue !== undefined && balanceValue === 0n
  const insufficientBalance =
    balanceValue !== undefined && parsedAmount > 0n && parsedAmount > balanceValue
  const canDelegate =
    walletReady &&
    !stakeBlocked &&
    parsedAmount > 0n &&
    !needsApproval &&
    balanceValue !== undefined &&
    parsedAmount <= balanceValue

  const isBatchFlow = supportsBatching && needsApproval
  const isSafeQueued = isStakeSafeQueued || isSafeApprovalQueued || isBatchSafeQueued

  const txBusy =
    isSigningTx ||
    isConfirmingTx ||
    isBatchSigning ||
    isBatchConfirming ||
    isApprovalPending ||
    isStakeSafeQueued

  const txSucceeded = isStaked || isBatchSuccess
  const stakeSteps = resolveStakeSteps({ supportsBatching, needsApproval, approvedInSession })
  const showStepper = stakeSteps.twoStep && !txSucceeded

  const stakeSimulation = useStakeSimulation(
    validator,
    parsedAmount,
    canDelegate && !txBusy && !txSucceeded,
  )

  const resetDialogState = useCallback(() => {
    setAmount('')
    setShowUnlimitedApproval(false)
    resetApprovalFlow()
    resetStake()
    resetBatch()
  }, [resetApprovalFlow, resetStake, resetBatch])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetDialogState()
      onOpenChange(next)
    },
    [onOpenChange, resetDialogState],
  )

  const delegLabel =
    stakeOnValidatorWei !== undefined && typeof stakeOnValidatorWei === 'bigint'
      ? formatTokenAmount(stakeOnValidatorWei)
      : '—'

  const walletBalanceLabel =
    balanceValue !== undefined ? formatTokenAmount(balanceValue) : '—'

  useSafeQueuedToast(isStakeSafeQueued)
  useResetOnWalletChange(() => handleOpenChange(false))

  useTxSuccessNotify(isStaked, () => {
    toast.success('Staking successful', {
      description: `Staked ${amount || '0'} SAFE to ${validatorLabel}`,
    })
  })

  useTxSuccessNotify(isBatchSuccess, () => {
    toast.success('Delegation successful', {
      description: `Approved and staked ${amount || '0'} SAFE to ${validatorLabel}`,
    })
  })

  useTxErrorToast(stakeError, 'Staking failed')
  useTxErrorToast(batchError, 'Delegation failed')

  useEffect(() => {
    if (!isBatchReverted) return

    toast.error('Transaction reverted', {
      description: 'The batch transaction was reverted onchain.',
    })
    resetBatch()
  }, [isBatchReverted, resetBatch])

  const showTxProgress = txBusy || txSucceeded
  const txProgressPhase = resolveTxProgressPhase({
    isSuccess: txSucceeded,
    isSafeQueued,
    isSigning: isSigningTx || isBatchSigning || isSigningApproval,
  })
  const progressTxHash =
    txSucceeded
      ? stakeTxHash ?? batchTxHash
      : isSigningApproval || isConfirmingApproval
        ? approvalTxHash
        : isBatchSigning || isBatchConfirming
          ? batchTxHash
          : stakeTxHash
  const progressDescription = txSucceeded
    ? `Staked ${amount || '0'} SAFE to ${validatorLabel}.`
    : isSigningApproval || isConfirmingApproval
      ? approvalProgressDescription(amount, approvalType)
      : undefined

  const progress = showTxProgress
    ? {
        phase: txProgressPhase,
        txHash: progressTxHash,
        description: progressDescription,
        children: showStepper ? <TxStepper steps={stakeSteps.steps} className="mb-6" /> : null,
      }
    : null

  const actions = isBatchFlow ? (
    <Button
      type="button"
      className="font-semibold"
      disabled={
        stakeBlocked ||
        parsedAmount === 0n ||
        insufficientBalance ||
        isBatchSigning ||
        isBatchConfirming
      }
      onClick={() => batchApproveAndStake(validator, parsedAmount)}
    >
      Approve & stake
    </Button>
  ) : needsApproval ? (
    <>
      {approvalType !== 'unlimited' && (
        <Button
          type="button"
          className="font-semibold"
          disabled={stakeBlocked || isApprovalPending || parsedAmount === 0n}
          onClick={approveExact}
        >
          Approve SAFE
        </Button>
      )}
      {approvalType !== 'exact' && showUnlimitedApproval && (
        <Button
          type="button"
          variant="outline"
          disabled={stakeBlocked || isApprovalPending || parsedAmount === 0n}
          onClick={approveUnlimited}
        >
          Approve unlimited
        </Button>
      )}
      {approvalType !== 'exact' && approvalType !== 'unlimited' && !showUnlimitedApproval && (
        <button
          type="button"
          className="text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
          disabled={stakeBlocked || isApprovalPending || parsedAmount === 0n}
          onClick={() => setShowUnlimitedApproval(true)}
        >
          Use unlimited approval instead
        </button>
      )}
    </>
  ) : (
    <Button
      type="button"
      className="font-semibold"
      disabled={!canDelegate || isSigningTx || isConfirmingTx}
      onClick={() => stake(validator, parsedAmount)}
    >
      Stake
    </Button>
  )

  return (
    <TxDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Stake SAFE"
      progress={progress}
      {...(showStepper ? { progressTitle: stakeStepTitle(stakeSteps.current) } : {})}
      dismissLocked={isSigningTx || isBatchSigning || isSigningApproval}
      cancelDisabled={txBusy}
      footerClassName="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end"
      actions={actions}
    >
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Validator</span>
        <div className="rounded-md border border-border bg-bg-sunken px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-text">{validatorLabel}</span>
            <AddressMono value={validator} compact className="-ml-0.5 justify-start text-left" />
          </div>
        </div>
        <p className="text-sm text-text-muted">
          Current delegation:{' '}
          <span className="font-mono tabular-nums text-text">{delegLabel} SAFE</span>
        </p>
      </div>

      {validatorsError ? (
        <p
          className="rounded-md border border-border bg-bg-sunken px-3.5 py-3 text-sm text-text-muted"
          role="alert"
        >
          Failed to load validators. Staking is unavailable until the validator list can be
          verified.
        </p>
      ) : validatorUnknown ? (
        <p
          className="rounded-md border border-border bg-bg-sunken px-3.5 py-3 text-sm text-text-muted"
          role="alert"
        >
          This address is not in the validator registry. Staking to unknown validators is disabled.
        </p>
      ) : validatorInactive ? (
        <p className="rounded-md border border-border bg-bg-sunken px-3.5 py-3 text-sm text-text-muted">
          This validator is inactive. New stakes are not accepted, but you can still unstake an
          existing delegation.
        </p>
      ) : null}

      <TokenAmountField
        inputId="stake-amount"
        hintId="stake-hint"
        value={amount}
        onChange={setAmount}
        disabled={stakeBlocked || hasZeroBalance || wrongNetwork}
        invalid={insufficientBalance && !hasZeroBalance}
        {...(balanceValue !== undefined ? { maxAmount: balanceValue } : {})}
        maxDisabled={stakeBlocked || hasZeroBalance || balanceValue === undefined || wrongNetwork}
        hintLabel="Wallet balance"
        hintValue={walletBalanceLabel}
        {...(insufficientBalance && !hasZeroBalance ? { errorMessage: 'Insufficient SAFE.' } : {})}
        {...(hasZeroBalance ? { emptyMessage: 'You do not have enough SAFE to stake.' } : {})}
      />

      <TxCheckNotice simulation={stakeSimulation} />

      {showStepper ? <TxStepper steps={stakeSteps.steps} /> : null}
      {isBatchFlow ? (
        <p className="m-0 text-xs text-text-muted">
          Your wallet bundles the approval and the stake into one confirmation.
        </p>
      ) : null}

      <div className="border-t border-border">
        <div className="pt-3 pb-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-text-subtle">
          Before you stake
        </div>
        <StakeDisclosureTerm
          k="Unstake cooldown"
          v={withdrawDelay !== undefined ? formatUnstakingDelayStat(withdrawDelay) : '—'}
          mono
          warn
        />
        <StakeDisclosureTerm
          k="Source of SAFE tokens"
          v={
            address ? (
              <AddressMono value={address} compact className="justify-end text-text" />
            ) : (
              '—'
            )
          }
        />
      </div>
    </TxDialog>
  )
}

function StakeDisclosureTerm({
  k,
  v,
  mono,
  warn,
  last,
}: {
  k: string
  v: ReactNode
  mono?: boolean
  warn?: boolean
  last?: boolean
}) {
  return (
    <div
      className={
        'flex items-center justify-between gap-4 py-2.5 ' +
        (last ? '' : 'border-b border-border-faint')
      }
    >
      <span className="text-sm text-text-muted">{k}</span>
      <span
        className={
          'text-right text-sm font-medium ' +
          (warn ? 'text-warning ' : 'text-text ') +
          (mono && typeof v === 'string' ? 'font-mono tabular-nums' : '')
        }
      >
        {v}
      </span>
    </div>
  )
}
