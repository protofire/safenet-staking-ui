import { Check } from 'lucide-react'

import type { FlowStep } from '@/lib/stakeSteps'
import { cn } from '@/lib/utils'

const markerClass = {
  done: 'border-success text-success',
  active: 'border-brand bg-brand-soft text-brand',
  upcoming: 'border-border text-text-subtle',
} as const

const labelClass = {
  done: 'text-text-muted',
  active: 'font-medium text-text',
  upcoming: 'text-text-subtle',
} as const

export function TxStepper({
  steps,
  className,
}: {
  steps: readonly FlowStep[]
  className?: string
}) {
  return (
    <ol
      className={cn(
        'm-0 flex list-none flex-col gap-2 rounded-md border border-border bg-bg-sunken px-3.5 py-3',
        className,
      )}
      aria-label="Transaction steps"
    >
      {steps.map((step, index) => (
        <li
          key={step.key}
          className="flex items-center gap-3"
          aria-current={step.state === 'active' ? 'step' : undefined}
        >
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-medium tabular-nums',
              markerClass[step.state],
            )}
            aria-hidden
          >
            {step.state === 'done' ? <Check className="size-3.5" /> : index + 1}
          </span>
          <span className={cn('text-sm', labelClass[step.state])}>
            <span className="sr-only">Step {index + 1}: </span>
            {step.label}
          </span>
          {step.hint ? (
            <span className="ml-auto text-xs font-medium text-success">{step.hint}</span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
