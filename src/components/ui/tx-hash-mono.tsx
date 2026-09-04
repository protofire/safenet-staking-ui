import { getExplorerTxUrl } from '@/lib/explorer'

import { MonoValue } from '@/components/ui/mono-value'

export function TxHashMono({
  value,
  className,
  lead = 4,
  tail = 6,
  copyable = true,
  compact = false,
  truncated = true,
}: {
  value: string
  className?: string
  lead?: number
  tail?: number
  copyable?: boolean
  compact?: boolean
  truncated?: boolean
}) {
  const explorerUrl = getExplorerTxUrl(value)

  return (
    <MonoValue
      value={value}
      lead={lead}
      tail={tail}
      truncated={truncated}
      copyable={copyable}
      compact={compact}
      {...(className !== undefined ? { className } : {})}
      {...(explorerUrl !== undefined ? { explorerUrl } : {})}
      copyLabel={`Copy transaction hash ${value}`}
      explorerLabel={`View transaction ${value} on block explorer`}
    />
  )
}
