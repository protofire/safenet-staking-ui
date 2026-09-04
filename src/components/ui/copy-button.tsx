import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export const iconActionClass =
  'inline-flex shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1'

export const iconActionSizes = {
  default: 'size-7',
  compact: 'size-6',
} as const

export function CopyButton({
  value,
  label,
  className,
  iconClassName,
  compact = false,
}: {
  value: string
  label?: string
  className?: string
  iconClassName?: string
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* ignore */
    }
  }

  const ariaLabel = label ?? `Copy ${value}`

  return (
    <button
      type="button"
      onClick={onCopy}
      title={copied ? 'Copied' : 'Copy'}
      aria-label={ariaLabel}
      className={cn(iconActionClass, compact ? iconActionSizes.compact : iconActionSizes.default, className)}
    >
      {copied ? (
        <Check className={cn(compact ? 'size-3' : 'size-3.5', 'text-success', iconClassName)} aria-hidden />
      ) : (
        <Copy className={cn(compact ? 'size-3' : 'size-3.5', 'opacity-70', iconClassName)} aria-hidden />
      )}
    </button>
  )
}
