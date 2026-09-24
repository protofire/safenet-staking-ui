import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card px-4 py-4 sm:px-5">
      <span className="min-w-0 max-w-full font-mono text-[clamp(0.875rem,3.6vw,1.375rem)] font-semibold leading-tight tracking-tight text-text tabular-nums [overflow-wrap:anywhere]">
        {value}
      </span>
      <span className="text-sm text-text-muted">{label}</span>
      {hint ? <span className="text-sm leading-snug text-text-muted/90">{hint}</span> : null}
    </div>
  )
}
