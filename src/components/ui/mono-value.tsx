import { CopyButton } from '@/components/ui/copy-button'
import { ExplorerLink } from '@/components/ui/explorer-link'
import { truncateMiddleParts } from '@/lib/format'
import { cn } from '@/lib/utils'

const monoTextClass =
  'font-mono tabular-nums tracking-normal [font-feature-settings:"tnum"] [font-variant-ligatures:none]'

export function MonoText({
  value,
  lead = 4,
  tail = 6,
  truncated = true,
  className,
}: {
  value: string
  lead?: number
  tail?: number
  truncated?: boolean
  className?: string
}) {
  const { start, end } = truncated
    ? truncateMiddleParts(value, lead, tail)
    : { start: value, end: null }

  return (
    <span className={cn(monoTextClass, 'whitespace-nowrap', className)}>
      {start}
      {end !== null ? (
        <>
          <span aria-hidden="true">...</span>
          {end}
        </>
      ) : null}
    </span>
  )
}

export function MonoValue({
  value,
  lead = 4,
  tail = 6,
  truncated = true,
  copyable = true,
  explorerUrl,
  showExplorer = true,
  copyLabel,
  explorerLabel,
  compact = false,
  className,
}: {
  value: string
  lead?: number
  tail?: number
  truncated?: boolean
  copyable?: boolean
  explorerUrl?: string
  showExplorer?: boolean
  copyLabel?: string
  explorerLabel?: string
  compact?: boolean
  className?: string
}) {
  const href = explorerUrl
  const showActions = copyable || (showExplorer && href)

  return (
    <span
      title={value}
      className={cn(
        'inline-flex w-fit max-w-full shrink-0 items-center text-text-muted',
        monoTextClass,
        compact ? 'gap-1 text-xs md:text-sm' : 'gap-1.5 text-sm md:text-base',
        className,
      )}
    >
      <MonoText value={value} lead={lead} tail={tail} truncated={truncated} />
      {showActions ? (
        <span className="inline-flex shrink-0 items-center -space-x-1">
          {copyable ? (
            <CopyButton value={value} label={copyLabel ?? `Copy ${value}`} compact />
          ) : null}
          {showExplorer && href ? (
            <ExplorerLink
              href={href}
              label={explorerLabel ?? `View ${value} on block explorer`}
              compact
            />
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
