import { useSwitchChain } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useWalletReady } from '@/hooks/useWalletReady'
import { cn } from '@/lib/utils'

type SwitchNetworkButtonProps = {
  className?: string
}

export function SwitchNetworkButton({ className }: SwitchNetworkButtonProps) {
  const { expectedChain } = useWalletReady()
  const { switchChain, isPending } = useSwitchChain()

  return (
    <Button
      type="button"
      className={cn('font-semibold', isPending && 'pointer-events-none opacity-70', className)}
      disabled={isPending}
      onClick={() => switchChain({ chainId: expectedChain.id })}
    >
      {isPending ? 'Switching…' : `Switch to ${expectedChain.name}`}
    </Button>
  )
}
