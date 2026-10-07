import { formatTokenAmount } from '@/lib/format'

export function StatSafeValue({ value }: { value: bigint | undefined }) {
  if (value === undefined) return '—'
  return (
    <>
      {formatTokenAmount(value)} <span className="text-text-muted">SAFE</span>
    </>
  )
}
