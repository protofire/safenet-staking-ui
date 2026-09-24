import { Pill } from '@/components/ui/pill'
import { chain, getChainDisplayName } from '@/config/chains'
import { useWalletReady } from '@/hooks/useWalletReady'
import { cn } from '@/lib/utils'

type NetworkBadgeProps = {
  variant?: 'pill' | 'badge'
  className?: string
}

export function NetworkBadge({ variant = 'badge', className }: NetworkBadgeProps) {
  const { wrongNetwork, walletChainId } = useWalletReady()
  const label = wrongNetwork ? getChainDisplayName(walletChainId) : chain.name
  const title = wrongNetwork
    ? `Wallet is on ${label}; this app runs on ${chain.name}`
    : 'Network for this deployment'

  if (variant === 'pill') {
    return (
      <span title={title}>
        <Pill
          tone={wrongNetwork ? 'warning' : 'default'}
          className={cn('h-6 max-w-[160px] truncate px-2 text-xs', className)}
        >
          {label}
        </Pill>
      </span>
    )
  }

  return (
    <span
      title={title}
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
