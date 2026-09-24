import { useModal } from 'connectkit'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useBlock, useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'

import { erc20Abi } from '@/abi/erc20Abi'
import { faucetAbi } from '@/abi/faucetAbi'
import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TxHashMono } from '@/components/ui/tx-hash-mono'
import { chain } from '@/config/chains'
import { getFaucetContractAddress } from '@/config/contracts'
import { useFaucetDrip } from '@/hooks/useFaucetDrip'
import { useTxErrorToast } from '@/hooks/useTxErrorToast'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatCountdown, formatDurationFromSeconds, formatTokenAmount } from '@/lib/format'
import { TX_PROGRESS_COPY } from '@/lib/txProgress'
import { cn } from '@/lib/utils'

const SEPOLIA_CHAIN_ID = sepolia.id

function FaucetUnavailable() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-12">
      <h1>Faucet</h1>
      <Card size="sm" className="gap-0">
        <CardHeader>
          <CardTitle className="text-base">Sepolia only</CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-2 text-sm text-text-muted">
          <p>The faucet is only available on Sepolia.</p>
          <p>
            Run this app with <span className="font-mono text-text">VITE_CHAIN_ID=11155111</span>, a
            Sepolia RPC and{' '}
            <span className="font-mono text-text">VITE_FAUCET_CONTRACT_ADDRESS</span> set to use the
            faucet.
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}

function FaucetSepoliaPanel({ faucetAddr }: { faucetAddr: `0x${string}` }) {
  const { setOpen } = useModal()
  const { address, isConnected, walletReady } = useWalletReady()
  const { data: block } = useBlock({ chainId: chain.id, watch: true })

  const { data: tokenAddr } = useReadContract({
    address: faucetAddr,
    abi: faucetAbi,
    functionName: 'token',
    chainId: chain.id,
  })

  const { data: name, isPending: namePending } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: 'name',
    chainId: chain.id,
    query: { enabled: Boolean(tokenAddr) },
  })
  const { data: symbol, isPending: symbolPending } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: 'symbol',
    chainId: chain.id,
    query: { enabled: Boolean(tokenAddr) },
  })
  const { data: decimals } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: chain.id,
    query: { enabled: Boolean(tokenAddr) },
  })

  const tokenDecimals = typeof decimals === 'number' ? decimals : 18

  const { data: balanceWei, isPending: balancePending } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: Boolean(tokenAddr && address) },
  })

  const { data: cooldownSeconds, isPending: cooldownPending } = useReadContract({
    address: faucetAddr,
    abi: faucetAbi,
    functionName: 'cooldown',
    chainId: chain.id,
  })

  const { data: dripAmountWei, isPending: dripAmountPending } = useReadContract({
    address: faucetAddr,
    abi: faucetAbi,
    functionName: 'dripAmount',
    chainId: chain.id,
  })

  const { data: poolWei, isPending: poolPending } = useReadContract({
    address: faucetAddr,
    abi: faucetAbi,
    functionName: 'poolBalance',
    chainId: chain.id,
  })

  const { data: nextDripAt, isPending: nextDripPending } = useReadContract({
    address: faucetAddr,
    abi: faucetAbi,
    functionName: 'nextDripAt',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: Boolean(address) },
  })

  const blockTs = block?.timestamp
  const canDripNow =
    isConnected &&
    Boolean(address) &&
    !nextDripPending &&
    blockTs !== undefined &&
    nextDripAt !== undefined &&
    (nextDripAt === 0n || nextDripAt <= blockTs)

  const waitSeconds =
    blockTs !== undefined && nextDripAt !== undefined && nextDripAt > 0n && blockTs < nextDripAt
      ? Number(nextDripAt - blockTs)
      : 0

  const { drip, isSigningTx, isConfirmingTx, isSuccess, isSafeQueued, error, reset, txHash } =
    useFaucetDrip(faucetAddr)

  useEffect(() => {
    if (!isSuccess) return
    toast.success('Drip confirmed')
    reset()
  }, [isSuccess, reset])

  useTxErrorToast(error, 'Drip failed')

  const titleLabel =
    namePending || symbolPending || !name || !symbol ? 'Token' : `${name} (${symbol})`

  const balanceLabel =
    balanceWei !== undefined && !balancePending
      ? formatTokenAmount(balanceWei, tokenDecimals)
      : null

  const cooldownLabel =
    cooldownSeconds !== undefined && !cooldownPending
      ? formatDurationFromSeconds(Number(cooldownSeconds))
      : null

  const perDripLabel =
    dripAmountWei !== undefined && dripAmountWei > 0n && !dripAmountPending
      ? formatTokenAmount(dripAmountWei, tokenDecimals)
      : null

  const poolLabel =
    poolWei !== undefined && !poolPending ? formatTokenAmount(poolWei, tokenDecimals) : null

  const busy = isSigningTx || isConfirmingTx || isSafeQueued
  const poolEmpty = poolWei !== undefined && poolWei === 0n
  const poolBelowOneDrip =
    !poolEmpty &&
    poolWei !== undefined &&
    dripAmountWei !== undefined &&
    dripAmountWei > 0n &&
    poolWei < dripAmountWei

  const handleDrip = () => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    if (!walletReady) return
    drip()
  }

  const readyData =
    Boolean(tokenAddr) && !dripAmountPending && !cooldownPending && !nextDripPending && !poolPending

  const actionDisabled =
    busy ||
    (isConnected &&
      (!walletReady ||
        !address ||
        !readyData ||
        !canDripNow ||
        poolEmpty ||
        poolBelowOneDrip ||
        (dripAmountWei !== undefined && dripAmountWei === 0n)))

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1>Faucet</h1>
        <p className="text-sm text-text-muted">Sepolia testnet</p>
      </div>

      <Card size="sm" className="gap-0">
        <CardHeader>
          <CardTitle className="text-base">{titleLabel}</CardTitle>
          <dl className="mt-1.5 grid gap-2 text-xs">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
              <dt className="text-text-muted">Faucet</dt>
              <dd className="min-w-0 justify-self-end">
                <AddressMono value={faucetAddr} className="text-text" compact truncated />
              </dd>
            </div>
            {tokenAddr ? (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
                <dt className="text-text-muted">Token</dt>
                <dd className="min-w-0 justify-self-end">
                  <AddressMono value={tokenAddr} className="text-text" compact truncated />
                </dd>
              </div>
            ) : null}
          </dl>
        </CardHeader>
        <CardFooter className="flex-col items-stretch gap-4">
          {isConnected && poolEmpty ? (
            <p
              className={cn(
                'rounded-md border px-3 py-2 text-sm',
                'border-[var(--warning)]/55 bg-[var(--warning-soft)] text-[var(--text)]',
              )}
            >
              Faucet pool is empty. Try again later or contact the operator.
            </p>
          ) : null}
          {isConnected && poolBelowOneDrip ? (
            <p
              className={cn(
                'rounded-md border px-3 py-2 text-sm',
                'border-[var(--warning)]/55 bg-[var(--warning-soft)] text-[var(--text)]',
              )}
            >
              Pool balance is less than one full drip. Try again later or contact the operator.
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-text-muted">Your balance</dt>
            <dd
              className="min-w-0 truncate text-right font-mono tabular-nums text-text"
              title={balanceLabel !== null && symbol ? `${balanceLabel} ${symbol}` : undefined}
            >
              {balancePending && balanceLabel === null ? (
                '…'
              ) : (
                <>
                  {balanceLabel ?? '0'} {symbol ?? ''}
                </>
              )}
            </dd>
            <dt className="text-text-muted">Amount per drip</dt>
            <dd
              className="min-w-0 truncate text-right font-mono tabular-nums text-text"
              title={perDripLabel !== null && symbol ? `${perDripLabel} ${symbol}` : undefined}
            >
              {dripAmountPending || perDripLabel === null ? (
                '…'
              ) : (
                <>
                  {perDripLabel} {symbol ?? ''}
                </>
              )}
            </dd>
            <dt className="text-text-muted">Cooldown</dt>
            <dd className="text-right text-text">
              {cooldownPending || cooldownLabel === null ? '…' : cooldownLabel}
            </dd>
            <dt className="text-text-muted">Faucet pool</dt>
            <dd
              className="min-w-0 truncate text-right font-mono tabular-nums text-text"
              title={poolLabel !== null && symbol ? `${poolLabel} ${symbol}` : undefined}
            >
              {poolPending || poolLabel === null ? '…' : `${poolLabel} ${symbol ?? ''}`}
            </dd>
            {isConnected && address && waitSeconds > 0 ? (
              <>
                <dt className="text-text-muted">Next drip</dt>
                <dd className="text-right tabular-nums text-text">
                  {formatCountdown(waitSeconds)}
                </dd>
              </>
            ) : null}
          </dl>

          <Button type="button" className="w-full" disabled={actionDisabled} onClick={handleDrip}>
            {!isConnected
              ? 'Connect wallet'
              : busy
                ? isSafeQueued
                  ? TX_PROGRESS_COPY['safe-queued'].title
                  : isSigningTx
                    ? TX_PROGRESS_COPY.signing.title
                    : TX_PROGRESS_COPY.confirming.title
                : waitSeconds > 0
                  ? 'Cooldown active'
                  : 'Request drip'}
          </Button>

          {txHash ? (
            <div className="flex justify-center">
              <TxHashMono value={txHash} compact className="text-xs" />
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </main>
  )
}

export default function Faucet() {
  const faucetAddr = getFaucetContractAddress(chain.id)
  const isSepoliaBuild = chain.id === SEPOLIA_CHAIN_ID

  if (!isSepoliaBuild || !faucetAddr) {
    return <FaucetUnavailable />
  }

  return <FaucetSepoliaPanel faucetAddr={faucetAddr} />
}
