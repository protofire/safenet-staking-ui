import { chain } from '@/config/chains'
import { useWalletReady } from '@/hooks/useWalletReady'

export function WrongNetworkPrompt({ className }: { className?: string }) {
  const { wrongNetwork } = useWalletReady()

  if (!wrongNetwork) return null

  return (
    <p className={className} role="alert">
      Your wallet is on a different network. Switch to{' '}
      <span className="font-semibold tabular-nums">{chain.name}</span> to continue.
    </p>
  )
}
