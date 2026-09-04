import type { TxSimulation } from '@/hooks/useTxSimulation'

export const TX_CHECK_COPY = {
  failed: 'This transaction will most likely fail',
  failedHint: 'You can still submit it, but the network fee would be lost.',
  unavailable: 'Could not check this transaction against the network. It may still succeed.',
} as const

export function TxCheckNotice({ simulation }: { simulation: TxSimulation }) {
  if (simulation.status === 'failed') {
    return (
      <p
        className="m-0 rounded-md border border-warning/55 bg-warning-soft px-3.5 py-3 text-sm text-text"
        role="alert"
      >
        <span className="font-medium">
          {TX_CHECK_COPY.failed}
          {simulation.reason ? `: ${simulation.reason}` : ''}.
        </span>{' '}
        <span className="text-text-muted">{TX_CHECK_COPY.failedHint}</span>
      </p>
    )
  }
  if (simulation.status === 'unavailable') {
    return <p className="m-0 text-xs text-text-muted">{TX_CHECK_COPY.unavailable}</p>
  }
  return null
}
