import { cn } from '@/lib/utils'

export function ProgressBar({
  pct,
  ready,
  className,
}: {
  pct: number
  ready?: boolean
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('relative h-px w-full bg-border', className)}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 transition-[width] duration-300 ease-out',
          ready ? 'bg-success' : 'bg-primary',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
