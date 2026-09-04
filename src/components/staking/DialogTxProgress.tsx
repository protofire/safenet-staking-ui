import type { Hex } from 'viem'
import { CircleCheck } from 'lucide-react'

import { TxHashMono } from '@/components/ui/tx-hash-mono'
import { TX_PROGRESS_COPY, type TxProgressPhase } from '@/lib/txProgress'

type DialogTxProgressProps = {
  phase: TxProgressPhase
  txHash?: Hex | undefined
  description?: string
}

function Spinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <circle cx="20" cy="20" r="16" stroke="var(--border)" strokeWidth="2" fill="none" />
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="var(--brand)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="40 100"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 20 20"
          to="360 20 20"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

export function DialogTxProgress({ phase, txHash, description }: DialogTxProgressProps) {
  const copy = TX_PROGRESS_COPY[phase]
  const body = description ?? copy.description

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      {phase === 'success' ? (
        <CircleCheck className="size-9 shrink-0 text-success" aria-hidden />
      ) : (
        <Spinner />
      )}
      <div>
        <p className="m-0 text-base font-semibold text-text">{copy.title}</p>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-text-muted">{body}</p>
        {phase === 'confirming' && txHash !== undefined ? (
          <TxHashMono value={txHash} className="mt-3 justify-center text-sm" />
        ) : null}
        {phase === 'success' && txHash !== undefined ? (
          <TxHashMono value={txHash} className="mt-3 justify-center text-sm" />
        ) : null}
      </div>
    </div>
  )
}
