import { useReadContract } from 'wagmi'

import { erc20Abi } from '@/abi/erc20Abi'
import { chain } from '@/config/chains'
import { getSafeTokenAddress } from '@/config/contracts'
import safeTokenPng from '@/assets/safe-token.png'

import { useWalletReady } from '@/hooks/useWalletReady'
import { formatTokenAmount } from '@/lib/format'
import { cn } from '@/lib/utils'

export function WalletSafeBalance({ className }: { className?: string }) {
  const { address, isConnected } = useWalletReady()
  const tokenAddress = getSafeTokenAddress(chain.id)

  const { data: balanceWei, isPending: balancePending } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  if (!isConnected) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs leading-none tabular-nums text-text-muted',
        className,
      )}
      title="SAFE token balance"
    >
      <img
        src={safeTokenPng}
        alt=""
        width={16}
        height={16}
        decoding="async"
        className="size-4 shrink-0 object-contain"
      />
      {balancePending && balanceWei === undefined ? (
        <span>…</span>
      ) : (
        <>
          <span className="text-text">
            {formatTokenAmount(balanceWei ?? 0n, 18, 4)}
          </span>
          <span>SAFE</span>
        </>
      )}
    </span>
  )
}
