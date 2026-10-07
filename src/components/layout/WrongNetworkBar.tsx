import { useSwitchChain } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useWalletReady } from '@/hooks/useWalletReady'
import { cn } from '@/lib/utils'

export function WrongNetworkBar() {
  const { wrongNetwork, expectedChain } = useWalletReady()
  const { switchChain, isPending } = useSwitchChain()

  if (!wrongNetwork) return null

  return (
    <div
      role="alert"
      className="border-b border-warning/35 bg-warning-soft px-4 py-2.5 text-warning shadow-banner"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center lg:justify-between lg:px-12 lg:text-left">
        <p className="min-w-0 text-sm leading-snug text-text">
          Your wallet is on a different network than this app.&nbsp;
          <span className="font-semibold tabular-nums text-warning">
            Switch to {expectedChain.name}
          </span>
          {' to stake and manage positions.'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            'border-warning bg-surface-raised text-text hover:bg-surface-hover hover:text-text dark:border-warning/60',
            isPending && 'pointer-events-none opacity-70',
          )}
          disabled={isPending}
          onClick={() => switchChain({ chainId: expectedChain.id })}
        >
          {isPending ? 'Switching…' : `Switch to ${expectedChain.name}`}
        </Button>
      </div>
    </div>
  )
}
