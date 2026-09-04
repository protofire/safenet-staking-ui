import { chain } from '@/config/chains'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

import { useWalletReady } from '@/hooks/useWalletReady'

type NetworkBadgeProps = {
  variant?: 'pill' | 'badge'
  className?: string
}

export function NetworkBadge({ variant = 'badge', className }: NetworkBadgeProps) {
  const { wrongNetwork } = useWalletReady()
  const label = wrongNetwork ? `Unknown chain` : chain.name

  if (variant === 'pill') {
    return (
      <span
        title={wrongNetwork ? 'Wallet chain does not match this app' : 'Network for this deployment'}
      >
        <Pill
          tone={wrongNetwork ? 'warning' : 'default'}
          className={cn('h-6 max-w-[160px] truncate px-2 text-xs', className)}
        >
          {wrongNetwork ? `Unknown chain` : chain.name}
        </Pill>
      </span>
    )
  }

  return (
    <span
      title={wrongNetwork ? 'Wallet chain does not match this app' : 'Network for this deployment'}
      className={cn(
        'inline-flex h-7 items-center rounded-md border px-2.5 text-xs leading-none',
        wrongNetwork
          ? 'border-warning/55 bg-warning-soft text-text'
          : 'border-border-faint bg-surface-raised text-text-muted',
        className,
      )}
    >
      {label}
    </span>
  )
}
