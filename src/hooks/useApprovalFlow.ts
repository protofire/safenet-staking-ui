import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { formatContractError } from '@/lib/contractErrors'
import { scheduleStateUpdate } from '@/lib/scheduleStateUpdate'

export function useApprovalFlow(parsedAmount: bigint) {
  const {
    allowance,
    approve: rawApprove,
    approveUnlimited: rawApproveUnlimited,
    isSigningApproval,
    isConfirmingApproval,
    isApproved,
    isSafeApprovalQueued,
    approvalError,
    approvalTxHash,
    resetApproval,
  } = useTokenAllowance()

  const [approvalType, setApprovalType] = useState<'exact' | 'unlimited' | null>(null)
  const [approvedInSession, setApprovedInSession] = useState(false)

  const visibleApprovalType = isApproved || approvalError ? null : approvalType

  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount

  const isApprovalPending = isSigningApproval || isConfirmingApproval || isSafeApprovalQueued

  useEffect(() => {
    if (!isApproved) return

    toast.success('Approval confirmed', {
      description: 'You can now stake your SAFE tokens.',
      ...(approvalTxHash ? { id: approvalTxHash } : {}),
    })
    resetApproval()
    return scheduleStateUpdate(() => setApprovedInSession(true))
  }, [isApproved, resetApproval, approvalTxHash])

  useEffect(() => {
    if (!approvalError) return

    toast.error('Approval failed', {
      description: formatContractError(approvalError),
    })
  }, [approvalError])

  useEffect(() => {
    if (!isSafeApprovalQueued) return

    toast.success('Transaction queued in Safe', {
      description:
        'Your transaction was sent to Safe Wallet for signing. Return here after it is executed.',
    })
  }, [isSafeApprovalQueued])

  const approveExact = useCallback(() => {
    setApprovalType('exact')
    rawApprove(parsedAmount)
  }, [rawApprove, parsedAmount])

  const approveUnlimited = useCallback(() => {
    setApprovalType('unlimited')
    rawApproveUnlimited()
  }, [rawApproveUnlimited])

  const resetApprovalFlow = useCallback(() => {
    setApprovalType(null)
    setApprovedInSession(false)
  }, [])

  return {
    allowance,
    needsApproval,
    approvalType: visibleApprovalType,
    approvedInSession,
    isApprovalPending,
    isSigningApproval,
    isConfirmingApproval,
    isSafeApprovalQueued,
    approvalTxHash,
    approveExact,
    approveUnlimited,
    resetApprovalFlow,
  }
}
