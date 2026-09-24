import { useModal } from 'connectkit'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useBlock } from 'wagmi'

import { StatCard } from '@/components/home/StatCard'
import { ConnectWalletPrompt } from '@/components/layout/ConnectWalletPrompt'
import { PortfolioRewardsShell } from '@/components/portfolio/PortfolioRewardsIntegration'
import { AddressMono } from '@/components/ui/address-mono'
import { Button } from '@/components/ui/button'
import { InfoStatSkeletonRow } from '@/components/ui/states'
import { TableHead } from '@/components/ui/table'
import { chain } from '@/config/chains'
import { env } from '@/config/env'
import { usePortfolioRewardsModels } from '@/hooks/usePortfolioRewardsModels'
import { useUserStakesOnValidators, useUserTotalStake } from '@/hooks/useStakingReads'
import { useValidators } from '@/hooks/useValidators'
import { useWalletReady } from '@/hooks/useWalletReady'
import { useUserPendingWithdrawals } from '@/hooks/useWithdrawals'
import { chartSegmentColor, type ChartTheme } from '@/lib/chartColors'
import { formatTokenAmount } from '@/lib/format'

type PositionRow = {
  address: `0x${string}`
  label: string
  commissionPct: number
  participationPct: number
  stake: bigint
  color: string
}

function sumPendingWei(entries: readonly { amount: bigint }[] | undefined): bigint {
  if (!entries?.length) return 0n
  return entries.reduce((acc, e) => acc + e.amount, 0n)
}

function conicGradientFromSegments(
  parts: { stake: bigint; color: string }[],
  total: bigint,
): string {
  if (total <= 0n || parts.length === 0) return 'transparent'
  let offset = 0
  const stops: string[] = []
  for (const p of parts) {
    const pct = Number((p.stake * 10000n) / total) / 100
    const start = offset
    offset += pct
    stops.push(`${p.color} ${start}% ${offset}%`)
  }
  return `conic-gradient(from -90deg, ${stops.join(', ')})`
}

function StakeDistributionDonut({
  segments,
  total,
}: {
  segments: { stake: bigint; color: string }[]
  total: bigint
}) {
  const gradient = useMemo(() => conicGradientFromSegments(segments, total), [segments, total])

  if (total <= 0n || segments.length === 0) {
    return (
      <div
        className="flex size-[188px] shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/30 font-mono text-xs text-text-muted"
        aria-hidden
      >
        —
      </div>
    )
  }

  return (
    <div className="relative size-[188px] shrink-0">
      <div className="size-full rounded-full" style={{ background: gradient }} aria-hidden />
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-card">
        <span className="font-mono text-xs tabular-nums text-text-muted">{segments.length}</span>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setOpen } = useModal()
  const { isConnected } = useWalletReady()
  const { data: block } = useBlock({ chainId: chain.id, watch: true })
  const portfolioRewardsModel = usePortfolioRewardsModels()
  const { resolvedTheme } = useTheme()
  const chartTheme: ChartTheme = resolvedTheme === 'light' ? 'light' : 'dark'
  const rewardsUiEnabled = env.rewardsUiEnabled
  const claimParam = searchParams.get('claim')
  const wantsClaimFromUrl = claimParam === '1' || claimParam === 'true'
  const [claimOpenState, setClaimOpenState] = useState<'closed' | 'manual' | 'url'>(() =>
    wantsClaimFromUrl ? 'url' : 'closed',
  )
  const urlClaimEligible = rewardsUiEnabled && !!portfolioRewardsModel.merkleDrop
  const effectiveClaimOpen =
    claimOpenState === 'manual' || (claimOpenState === 'url' && urlClaimEligible)

  const setClaimOpen = (open: boolean) => {
    setClaimOpenState(open ? 'manual' : 'closed')
  }

  useEffect(() => {
    if (!wantsClaimFromUrl) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('claim')
        return next
      },
      { replace: true },
    )
  }, [wantsClaimFromUrl, setSearchParams])

  const {
    data: validators,
    isPending: validatorsPending,
    isError: validatorsError,
    isFetching: validatorsFetching,
    refetch,
  } = useValidators()

  const validatorAddresses = useMemo(() => validators?.map((v) => v.address) ?? [], [validators])

  const { data: stakeReads, isPending: stakesPending } =
    useUserStakesOnValidators(validatorAddresses)

  const { data: totalStakeWei, isPending: totalStakePending } = useUserTotalStake()

  const { data: rawPendingWithdrawals, isPending: withdrawalsPending } = useUserPendingWithdrawals()

  const pendingQueue = useMemo(() => {
    if (!rawPendingWithdrawals?.length) return []
    return rawPendingWithdrawals.filter((w) => w.amount > 0n)
  }, [rawPendingWithdrawals])

  const pendingTotalWei = useMemo(() => sumPendingWei(pendingQueue), [pendingQueue])

  const pendingWithdrawalMeta = useMemo(() => {
    const queue = pendingQueue
    const count = queue.length
    const ts = block?.timestamp
    if (count === 0) return { count: 0, cooling: 0 as number | null }
    if (ts === undefined) return { count, cooling: null as number | null }
    let cooling = 0
    for (const w of queue) {
      if (ts < w.claimableAt) cooling += 1
    }
    return { count, cooling }
  }, [pendingQueue, block?.timestamp])

  const positions = useMemo((): PositionRow[] => {
    if (!validators || !stakeReads) return []
    const rows: PositionRow[] = []
    validators.forEach((v, i) => {
      const r = stakeReads[i]
      if (r?.status !== 'success' || typeof r.result !== 'bigint') return
      const stake = r.result
      if (stake <= 0n) return
      rows.push({
        address: v.address,
        label: v.label,
        commissionPct: v.commission * 100,
        participationPct: v.participationRate14d * 100,
        stake,
        color: '',
      })
    })
    rows.sort((a, b) => (a.stake > b.stake ? -1 : a.stake < b.stake ? 1 : 0))
    return rows.map((row, i) => ({
      ...row,
      color: chartSegmentColor(i, rows.length, chartTheme),
    }))
  }, [validators, stakeReads, chartTheme])

  const distributionSegments = useMemo(
    () => positions.map((p) => ({ stake: p.stake, color: p.color })),
    [positions],
  )

  const distributionTotal = useMemo(() => positions.reduce((s, p) => s + p.stake, 0n), [positions])

  const loadingRows =
    !isConnected || validatorsPending || stakesPending || totalStakePending || withdrawalsPending

  const rewardsMerkleStatsLoading =
    isConnected &&
    rewardsUiEnabled &&
    !!portfolioRewardsModel.merkleDrop &&
    portfolioRewardsModel.loading

  const statStripLoading = loadingRows || rewardsMerkleStatsLoading
  const stakeOutsideRegistry =
    !loadingRows &&
    totalStakeWei !== undefined &&
    totalStakeWei > 0n &&
    totalStakeWei > distributionTotal

  const openUndelegate = (validatorAddress: string) => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    navigate(`/validators?undelegate=${validatorAddress}`)
  }

  const stakeMore = () => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    navigate('/validators')
  }

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-5 sm:mb-6">
        <h1>Portfolio</h1>
      </header>

      {!isConnected && (
        <ConnectWalletPrompt
          variant="inline"
          suffixMessage="to see your stake and withdrawals."
          className="mb-6"
        />
      )}

      {isConnected && validatorsError && (
        <p className="mb-4 text-sm text-danger" role="alert">
          Could not load validators.{' '}
          <button
            type="button"
            className="underline underline-offset-4"
            disabled={validatorsFetching}
            onClick={() => void refetch()}
          >
            {validatorsFetching ? 'Retrying…' : 'Retry'}
          </button>
        </p>
      )}

      {isConnected && (
        <>
          <div className="mb-8 flex flex-col gap-2.5">
            {rewardsUiEnabled ? (
              <PortfolioRewardsShell
                model={portfolioRewardsModel}
                claimOpen={effectiveClaimOpen}
                setClaimOpen={setClaimOpen}
                rewardsUiEnabled={rewardsUiEnabled}
                portfolioEmpty={positions.length === 0}
              />
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {statStripLoading ? (
                <InfoStatSkeletonRow count={4} />
              ) : (
                <>
                  <StatCard
                    value={
                      totalStakeWei !== undefined ? (
                        <>
                          {formatTokenAmount(totalStakeWei)}{' '}
                          <span className="text-text-muted">SAFE</span>
                        </>
                      ) : (
                        '—'
                      )
                    }
                    label="Your stake"
                    hint={
                      (totalStakeWei ?? 0n) === 0n
                        ? 'No active positions'
                        : stakeOutsideRegistry && positions.length === 0
                          ? 'Includes stake on validators not listed below'
                          : positions.length === 1
                            ? 'Across 1 validator'
                            : `Across ${positions.length} validators`
                    }
                  />
                  <StatCard
                    value={
                      <>
                        {formatTokenAmount(pendingTotalWei)}{' '}
                        <span className="text-text-muted">SAFE</span>
                      </>
                    }
                    label="Pending withdrawals"
                    hint={
                      pendingWithdrawalMeta.count === 0
                        ? 'Nothing in queue'
                        : pendingWithdrawalMeta.cooling === null
                          ? `${pendingWithdrawalMeta.count} in queue`
                          : `${pendingWithdrawalMeta.cooling} of ${pendingWithdrawalMeta.count} cooling down`
                    }
                  />
                  {rewardsUiEnabled ? (
                    <StatCard
                      value={
                        portfolioRewardsModel.proof ? (
                          <>
                            {formatTokenAmount(portfolioRewardsModel.rewards.claimable)}{' '}
                            <span className="text-text-muted">SAFE</span>
                          </>
                        ) : (
                          '—'
                        )
                      }
                      label="Claimable rewards"
                      hint={
                        portfolioRewardsModel.rewards.rootStale
                          ? 'Merkle root on-chain does not match the rewards file — claim stays off until they match'
                          : !portfolioRewardsModel.proof
                            ? 'No rewards allocated'
                            : portfolioRewardsModel.rewards.claimable === 0n
                              ? 'Nothing to claim yet'
                              : 'Tokens ready to be transferred'
                      }
                    />
                  ) : (
                    <StatCard value="—" label="Claimable rewards" hint="Rewards data pending" />
                  )}
                  {rewardsUiEnabled ? (
                    <StatCard
                      value={
                        portfolioRewardsModel.proof ? (
                          <>
                            {formatTokenAmount(portfolioRewardsModel.rewards.totalClaimed)}{' '}
                            <span className="text-text-muted">SAFE</span>
                          </>
                        ) : (
                          '—'
                        )
                      }
                      label="Total claimed"
                      hint="Tokens transferred"
                    />
                  ) : (
                    <StatCard value="—" label="Lifetime claimed" hint="Rewards data pending" />
                  )}
                </>
              )}
            </div>
          </div>

          {loadingRows ? null : stakeOutsideRegistry && positions.length > 0 ? (
            <div className="mb-4 rounded-lg border border-dashed border-warning/50 bg-muted/20 px-4 py-3">
              <p className="font-mono text-xs text-warning">
                <span className="font-semibold uppercase tracking-wide">Note</span> — Your total
                stake is higher than the sum in this breakdown (
                <span className="tabular-nums">
                  {totalStakeWei !== undefined ? formatTokenAmount(totalStakeWei) : '—'}
                </span>{' '}
                vs <span className="tabular-nums">{formatTokenAmount(distributionTotal)}</span>{' '}
                SAFE). Some validators you use may not appear in this list.
              </p>
            </div>
          ) : null}

          {loadingRows ? null : positions.length === 0 ? (
            stakeOutsideRegistry ? (
              <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14">
                <p className="text-sm font-semibold text-warning">
                  Stake not shown in this breakdown
                </p>
                <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
                  You still have{' '}
                  <span className="font-mono tabular-nums">
                    {totalStakeWei !== undefined ? formatTokenAmount(totalStakeWei) : '—'} SAFE
                  </span>{' '}
                  staked, but none of the validators listed here match that stake. Open Validators
                  to unstake using the validator you chose, or confirm you are on the same network
                  as when you staked.
                </p>
                <Button type="button" className="mt-6 font-semibold" onClick={() => stakeMore()}>
                  Open validators
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14">
                <p className="text-sm font-semibold text-text">
                  You have no stake with the validators listed here.
                </p>
                <p className="mt-6 max-w-prose text-center text-base text-balance text-text-muted">
                  After you stake with a validator, it appears in the chart and table.
                </p>
                <Button type="button" className="mt-6 font-semibold" onClick={() => stakeMore()}>
                  Browse validators
                </Button>
              </div>
            )
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                  <h2>Stake distribution</h2>
                  <span className="eyebrow">{positions.length} validators</span>
                </div>
                <div className="flex flex-col items-center gap-5 px-4 py-6">
                  <StakeDistributionDonut
                    segments={distributionSegments}
                    total={distributionTotal}
                  />
                  <ul className="w-full space-y-3 sm:space-y-2">
                    {positions.map((p) => {
                      const pct =
                        distributionTotal > 0n
                          ? Number((p.stake * 10000n) / distributionTotal) / 100
                          : 0
                      return (
                        <li key={p.address} className="flex items-center gap-2.5 text-sm">
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{ background: p.color }}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate font-medium text-text">
                            {p.label}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-text-muted">
                            {formatTokenAmount(p.stake)}
                          </span>
                          <span className="w-12 text-right font-mono text-xs tabular-nums text-text-muted">
                            {pct.toFixed(1)}%
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
                <div className="border-b border-border px-4 py-3 sm:px-5">
                  <h2>Validators with your stake</h2>
                </div>
                <div className="md:hidden">
                  <ul className="divide-y divide-border">
                    {positions.map((p, idx) => (
                      <li key={p.address} className="px-4 py-4">
                        <div>
                          <p className="font-mono text-xs tabular-nums text-text-muted">
                            {String(idx + 1).padStart(2, '0')}
                          </p>
                          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="shrink-0 text-sm font-medium text-text">
                              {p.label}
                            </span>
                            <AddressMono value={p.address} compact truncated />
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:text-sm">
                          <dt className="text-text-muted">Tokens</dt>
                          <dd className="text-right font-mono tabular-nums text-text">
                            {formatTokenAmount(p.stake)} SAFE
                          </dd>
                          <dt className="text-text-muted">Commission</dt>
                          <dd className="text-right font-mono tabular-nums text-text-muted">
                            {p.commissionPct.toFixed(1)}%
                          </dd>
                          <dt className="text-text-muted">Part. 14d</dt>
                          <dd className="text-right font-mono tabular-nums text-text-muted">
                            {p.participationPct.toFixed(2)}%
                          </dd>
                        </dl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 h-10 w-full font-medium"
                          onClick={() => openUndelegate(p.address)}
                        >
                          Unstake
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden min-w-0 md:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-bg-sunken">
                        <TableHead className="w-10 text-left">#</TableHead>
                        <TableHead className="w-[1%] text-left">Validator</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="w-px whitespace-nowrap text-right">
                          Commission
                        </TableHead>
                        <TableHead className="w-px whitespace-nowrap text-right">
                          Part. 14d
                        </TableHead>
                        <TableHead className="w-px whitespace-nowrap">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((p, idx) => {
                        const tokensLabel = formatTokenAmount(p.stake)
                        return (
                          <tr
                            key={p.address}
                            className="border-b border-border-faint transition-colors hover:bg-surface-hover"
                          >
                            <td className="px-5 py-3 font-mono text-xs tabular-nums text-text-muted">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="truncate font-medium text-text">{p.label}</span>
                                <AddressMono value={p.address} compact truncated />
                              </div>
                            </td>
                            <td
                              className="whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text"
                              aria-label={`${tokensLabel} SAFE staked`}
                            >
                              <span className="whitespace-nowrap">{tokensLabel}</span>
                              <span className="ml-1 font-normal text-text-muted">SAFE</span>
                            </td>
                            <td className="w-px whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text-muted">
                              {p.commissionPct.toFixed(1)}%
                            </td>
                            <td className="w-px whitespace-nowrap px-5 py-3 text-right font-mono text-xs tabular-nums text-text-muted">
                              {p.participationPct.toFixed(2)}%
                            </td>
                            <td className="w-px whitespace-nowrap px-5 py-3 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="font-mono text-sm font-medium"
                                onClick={() => openUndelegate(p.address)}
                              >
                                Unstake
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
