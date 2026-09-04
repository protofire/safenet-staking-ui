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
      className="border-b border-[var(--warning)]/35 bg-[var(--warning-soft)] px-4 py-2.5 text-[var(--warning)] shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-none"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center lg:justify-between lg:px-12 lg:text-left">
        <p className="min-w-0 text-sm leading-snug text-[var(--text)]">
          Your wallet is on a different network than this app.&nbsp;
          <span className="font-semibold tabular-nums text-[var(--warning)]">
            Switch to {expectedChain.name}
          </span>
          {' to stake and manage positions.'}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            'border-[var(--warning)] bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] dark:border-[var(--warning)]/60',
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
