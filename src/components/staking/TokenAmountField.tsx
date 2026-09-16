import { formatAmountInputDisplay, isValidAmountInput, sanitizeAmountInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatUnits } from 'viem'

type TokenAmountFieldProps = {
  inputId: string
  hintId: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  maxAmount?: bigint
  maxDisabled?: boolean
  hintLabel: string
  hintValue: string
  errorMessage?: string
  emptyMessage?: string
}

export function TokenAmountField({
  inputId,
  hintId,
  value,
  onChange,
  disabled,
  invalid,
  maxAmount,
  maxDisabled,
  hintLabel,
  hintValue,
  errorMessage,
  emptyMessage,
}: TokenAmountFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="eyebrow block">
        Amount
      </label>
      <div
        className={cn(
          'flex h-14 items-center gap-2 rounded-md border bg-bg-sunken px-3 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
          invalid ? 'border-danger' : 'border-input-border',
        )}
      >
        <input
          id={inputId}
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
          value={formatAmountInputDisplay(value)}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={hintId}
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xl font-medium tabular-nums tracking-tight text-text outline-none placeholder:text-text-subtle"
          onChange={(e) => {
            const sanitized = sanitizeAmountInput(e.target.value)
            if (isValidAmountInput(sanitized)) onChange(sanitized)
          }}
        />
        <span className="shrink-0 font-mono text-xs text-text-muted">SAFE</span>
        <button
          type="button"
          disabled={maxDisabled || maxAmount === undefined}
          className="shrink-0 rounded-sm border border-primary px-2 py-1 font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => maxAmount !== undefined && onChange(formatUnits(maxAmount, 18))}
        >
          MAX
        </button>
      </div>
      <div
        id={hintId}
        className="flex flex-wrap items-center justify-between gap-2 pt-1 text-sm text-text-muted"
      >
        <span>
          {hintLabel}:{' '}
          <span className="font-mono tabular-nums text-text">{hintValue} SAFE</span>
        </span>
        {errorMessage ? (
          <span className="font-medium text-danger">{errorMessage}</span>
        ) : null}
      </div>
      {emptyMessage ? <p className="text-sm text-danger">{emptyMessage}</p> : null}
    </div>
  )
}
