import { Button } from '@/components/ui/button'
import { TxCheckNotice } from '@/components/ui/tx-check-notice'
import { TxDialog } from '@/components/ui/tx-dialog'
import { IDLE_SIMULATION, type TxSimulation } from '@/hooks/useTxSimulation'
import { formatTokenAmount } from '@/lib/format'
import { resolveTxProgressPhase } from '@/lib/txProgress'

type ClaimWithdrawalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'single' | 'batch'
  matureCount: number
  totalAmountWei: bigint
  isSigning: boolean
  isConfirming: boolean
  isSafeQueued?: boolean
  showSuccess?: boolean
  successDescription?: string
  txHash?: `0x${string}` | undefined
  simulation?: TxSimulation
  onSubmit: () => void
}

export function ClaimWithdrawalDialog({
  open,
  onOpenChange,
  mode,
  matureCount,
  totalAmountWei,
  isSigning,
  isConfirming,
  isSafeQueued = false,
  showSuccess = false,
  successDescription,
  txHash,
  simulation = IDLE_SIMULATION,
  onSubmit,
}: ClaimWithdrawalDialogProps) {
  const txBusy = isSigning || isConfirming || isSafeQueued || showSuccess
  const label = mode === 'batch' ? `Claim ${matureCount} withdrawals` : 'Claim withdrawal'

  return (
    <TxDialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      dismissLocked={isSigning}
      cancelDisabled={txBusy}
      progress={
        txBusy
          ? {
              phase: resolveTxProgressPhase({ isSuccess: showSuccess, isSafeQueued, isSigning }),
              txHash,
              description: successDescription,
            }
          : null
      }
      actions={
        <Button type="button" className="font-semibold" onClick={onSubmit}>
          {label}
        </Button>
      }
    >
      <div className="rounded-md border border-border-faint bg-bg-sunken p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="eyebrow">Total</span>
          <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-text">
            {formatTokenAmount(totalAmountWei)}
            <span className="ml-1.5 text-xs font-normal text-text-muted">SAFE</span>
          </span>
        </div>
      </div>
      <TxCheckNotice simulation={simulation} />
      {mode === 'batch' && matureCount > 1 && (
        <p className="m-0 text-sm leading-relaxed text-text-muted">
          All {matureCount} claims are submitted in one atomic transaction via EIP-5792 when your
          wallet supports batching.
        </p>
      )}
    </TxDialog>
  )
}
