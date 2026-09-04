export type TxProgressPhase = 'signing' | 'confirming' | 'safe-queued' | 'success'

export const TX_PROGRESS_COPY = {
  signing: {
    title: 'Confirm in your wallet',
    description: 'Open your wallet to review and sign the transaction.',
  },
  confirming: {
    title: 'Waiting for confirmation',
    description: 'Submitted to network.',
  },
  'safe-queued': {
    title: 'Transaction queued in Safe',
    description:
      'Your transaction was sent to Safe Wallet for signing. Return here after it is executed.',
  },
  success: {
    title: 'Transaction confirmed',
    description: 'Your transaction was successful.',
  },
} as const

export function txProgressTitle(phase: TxProgressPhase): string {
  return TX_PROGRESS_COPY[phase].title
}

export function resolveTxProgressPhase(flags: {
  isSuccess?: boolean
  isSafeQueued?: boolean
  isSigning?: boolean
}): TxProgressPhase {
  if (flags.isSuccess) return 'success'
  if (flags.isSafeQueued) return 'safe-queued'
  if (flags.isSigning) return 'signing'
  return 'confirming'
}
