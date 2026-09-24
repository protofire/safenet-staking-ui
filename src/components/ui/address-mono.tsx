import { MonoValue } from '@/components/ui/mono-value'
import { getExplorerAddressUrl } from '@/lib/explorer'

export function AddressMono({
  value,
  className,
  lead = 4,
  tail = 6,
  explorerUrl,
  showExplorer = true,
  copyable = true,
  compact = false,
  truncated = true,
}: {
  value: string
  className?: string
  lead?: number
  tail?: number
  explorerUrl?: string
  showExplorer?: boolean
  copyable?: boolean
  compact?: boolean
  truncated?: boolean
}) {
  const resolvedExplorerUrl =
    explorerUrl ?? (showExplorer ? getExplorerAddressUrl(value) : undefined)

  return (
    <MonoValue
      value={value}
      lead={lead}
      tail={tail}
      truncated={truncated}
      copyable={copyable}
      compact={compact}
      {...(className !== undefined ? { className } : {})}
      {...(resolvedExplorerUrl !== undefined ? { explorerUrl: resolvedExplorerUrl } : {})}
      showExplorer={showExplorer}
      copyLabel={`Copy address ${value}`}
      explorerLabel={`View ${value} on block explorer`}
    />
  )
}
