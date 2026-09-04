export type FlowStepState = 'done' | 'active' | 'upcoming'

export type FlowStep = {
  key: string
  label: string
  state: FlowStepState
  hint?: string
}

export const STAKE_STEP_LABELS = {
  approve: 'Approve SAFE',
  stake: 'Stake',
} as const

export const STAKE_STEP_HINTS = {
  approved: 'Approved',
} as const

export type StakeStepFlags = {
  supportsBatching: boolean
  needsApproval: boolean
  approvedInSession: boolean
}

export type StakeSteps = {
  twoStep: boolean
  current: 1 | 2
  steps: readonly FlowStep[]
}

export function resolveStakeSteps(flags: StakeStepFlags): StakeSteps {
  const twoStep = !flags.supportsBatching && (flags.needsApproval || flags.approvedInSession)
  const current: 1 | 2 = flags.needsApproval ? 1 : 2
  const approveDone = current === 2
  return {
    twoStep,
    current,
    steps: [
      {
        key: 'approve',
        label: STAKE_STEP_LABELS.approve,
        state: approveDone ? 'done' : 'active',
        ...(approveDone ? { hint: STAKE_STEP_HINTS.approved } : {}),
      },
      {
        key: 'stake',
        label: STAKE_STEP_LABELS.stake,
        state: approveDone ? 'active' : 'upcoming',
      },
    ],
  }
}

export function stakeStepTitle(current: 1 | 2): string {
  const label = current === 1 ? STAKE_STEP_LABELS.approve : STAKE_STEP_LABELS.stake
  return `Step ${current} of 2 · ${label}`
}

export function approvalProgressDescription(
  amount: string,
  approvalType: 'exact' | 'unlimited' | null,
): string {
  if (approvalType === 'unlimited') {
    return 'Allow the staking contract to use your SAFE without a limit.'
  }
  return `Allow the staking contract to use ${amount || '0'} SAFE.`
}
