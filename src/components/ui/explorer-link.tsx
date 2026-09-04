import { ExternalLink } from 'lucide-react'

import { iconActionClass, iconActionSizes } from '@/components/ui/copy-button'
import { cn } from '@/lib/utils'

export function ExplorerLink({
  href,
  label,
  className,
  iconClassName,
  compact = false,
}: {
  href: string
  label: string
  className?: string
  iconClassName?: string
  compact?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className={cn(
        iconActionClass,
        compact ? iconActionSizes.compact : iconActionSizes.default,
        className,
      )}
    >
      <ExternalLink
        className={cn(compact ? 'size-3' : 'size-3.5', 'opacity-70', iconClassName)}
        aria-hidden
      />
    </a>
  )
}
