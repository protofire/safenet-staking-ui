import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useBalance, useBlockNumber } from 'wagmi'

import { chain } from '@/config/chains'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatTokenAmount } from '@/lib/format'
import { cn } from '@/lib/utils'

export function WalletEthBalance({ className }: { className?: string }) {
  const { address, isConnected } = useWalletReady()
  const queryClient = useQueryClient()

  const { data: balance, queryKey } = useBalance({
    address,
    chainId: chain.id,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  const { data: blockNumber } = useBlockNumber({
    watch: true,
    chainId: chain.id,
    query: { enabled: Boolean(address && isConnected) },
  })

  useEffect(() => {
    if (blockNumber === undefined) return
    void queryClient.invalidateQueries({ queryKey })
  }, [blockNumber, queryClient, queryKey])

  if (!isConnected) return null

  const symbol = chain.nativeCurrency.symbol

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs leading-none tabular-nums text-text-muted',
        className,
      )}
      title={balance ? `${balance.formatted} ${symbol}` : undefined}
    >
      {balance === undefined ? (
        <span>…</span>
      ) : (
        <>
          <span className="text-text">{formatTokenAmount(balance.value, balance.decimals)}</span>
          <span>{symbol}</span>
        </>
      )}
    </span>
  )
}
