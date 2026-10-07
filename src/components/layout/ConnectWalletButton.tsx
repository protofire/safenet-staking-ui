import { ConnectKitButton } from 'connectkit'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MonoText } from '@/components/ui/mono-value'
import { cn } from '@/lib/utils'

type ConnectWalletButtonProps = {
  size?: 'sm' | 'default'
  showChevron?: boolean
  className?: string
}

export function ConnectWalletButton({
  size = 'default',
  showChevron = false,
  className,
}: ConnectWalletButtonProps) {
  const isCompact = size === 'sm'

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, show }) =>
        isConnected && address ? (
          <Button
            type="button"
            variant="outline"
            size={isCompact ? 'sm' : 'sm'}
            className={cn(
              'shrink-0 gap-1 font-mono text-xs tabular-nums',
              isCompact
                ? 'h-7 max-w-33 border-input-border bg-transparent px-2'
                : 'h-8 border-input-border bg-transparent px-3 text-text hover:bg-muted/50',
              className,
            )}
            onClick={() => show?.()}
          >
            <MonoText value={address} className="text-xs text-text" />
            {showChevron ? <ChevronDown className="size-3.5 opacity-60" aria-hidden /> : null}
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size={isCompact ? 'sm' : 'sm'}
            className={cn(
              'shrink-0 font-semibold',
              isCompact ? 'h-7' : 'h-8 gap-1 px-3',
              className,
            )}
            onClick={() => show?.()}
          >
            Connect wallet
            {showChevron ? <ChevronDown className="size-3.5 opacity-60" aria-hidden /> : null}
          </Button>
        )
      }
    </ConnectKitButton.Custom>
  )
}
