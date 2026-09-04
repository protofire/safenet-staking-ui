import { useModal } from 'connectkit'
import { formatUnits } from 'viem'
import { useNavigate } from 'react-router'
import { useReadContract } from 'wagmi'

import { stakingAbi } from '@/abi/stakingAbi'
import { StatCard } from '@/components/home/StatCard'
import { Button } from '@/components/ui/button'
import { InfoStatSkeletonRow } from '@/components/ui/states'
import { chain } from '@/config/chains'
import { getMerkleDropAddress, getStakingContractAddress } from '@/config/contracts'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { useUserTotalStake } from '@/hooks/useStakingReads'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatCooldownForBlurb, formatTokenAmount, formatUnstakingDelayStat } from '@/lib/format'

const STAKING_READS_OPTS = { refetchInterval: 30_000 as const }

function formatTotalStakedLabel(totalStakedWei: bigint): { display: string; title?: string } {
  const n = Number(formatUnits(totalStakedWei, 18))
  if (!Number.isFinite(n)) return { display: '—' }

  const full = n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const abs = Math.abs(n)
  if (abs < 1_000_000) {
    return { display: full }
  }

  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(n)

  return { display: compact, title: `${full} SAFE` }
}

export default function Home() {
  const { isConnected } = useWalletReady()
  const { setOpen } = useModal()
  const navigate = useNavigate()
  const merkleDrop = getMerkleDropAddress()
  const stakingAddress = getStakingContractAddress(chain.id)
  const { data: withdrawDelaySeconds, isPending: withdrawDelayPending } = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: 'withdrawDelay',
    chainId: chain.id,
    query: STAKING_READS_OPTS,
  })
  const { data: totalStakedWei, isPending: totalStakedPending } = useReadContract({
    address: stakingAddress,
    abi: stakingAbi,
    functionName: 'totalStakedAmount',
    chainId: chain.id,
    query: STAKING_READS_OPTS,
  })
  const { data: userTotalStakeWei, isPending: userStakePending } = useUserTotalStake()
  const { data: walletSafeWei, isPending: walletSafePending } = useTokenBalance()

  const walletBalanceWei = walletSafePending ? null : (walletSafeWei ?? 0n)

  function ensureConnected(action: () => void) {
    if (!isConnected) {
      setOpen(true)
      return
    }
    action()
  }

  function handleStake() {
    ensureConnected(() => navigate('/validators'))
  }

  function handleUnstake() {
    ensureConnected(() => navigate('/portfolio'))
  }

  function handleClaimRewards() {
    ensureConnected(() => {
      navigate(merkleDrop ? '/portfolio?claim=1' : '/portfolio')
    })
  }

  const cooldownValue =
    withdrawDelaySeconds !== undefined ? formatUnstakingDelayStat(withdrawDelaySeconds) : '—'
  const cooldownPhrase =
    withdrawDelaySeconds !== undefined ? formatCooldownForBlurb(withdrawDelaySeconds) : ''
  const totalStakedFormatted =
    totalStakedWei !== undefined ? formatTotalStakedLabel(totalStakedWei) : { display: '—' as const }
  const protocolStatsLoading = totalStakedPending || withdrawDelayPending

  return (
    <main className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-start px-6 pt-14 pb-16 lg:pt-28 lg:pb-32">
      <section aria-labelledby="home-hero-heading" className="flex w-full flex-col items-start">
        <h1 id="home-hero-heading" className="home-hero-title w-full">
          <span className="block">Stake SAFE.</span>
          <span className="block">Earn rewards.</span>
        </h1>

        <p className="home-hero-subtitle">
          Delegate any amount to a validator and start earning protocol rewards. Withdraw any time
          after{cooldownPhrase ? ` a ${cooldownPhrase}` : ''} unstaking cooldown.
        </p>

        <div className="mt-7 flex w-full max-w-[480px] flex-col gap-2.5 lg:mt-8">
          <div className="grid w-full grid-cols-2 gap-2.5">
            {protocolStatsLoading ? (
              <InfoStatSkeletonRow count={2} />
            ) : (
              <>
                <StatCard
                  value={
                    totalStakedFormatted.display === '—' ? (
                      '—'
                    ) : (
                      <>
                        <span title={totalStakedFormatted.title}>{totalStakedFormatted.display}</span>{' '}
                        <span className="text-base font-normal text-text-muted">SAFE</span>
                      </>
                    )
                  }
                  label="Total staked"
                />
                <StatCard value={cooldownValue} label="Unstaking cooldown" />
              </>
            )}
          </div>

          {isConnected ? (
            <div className="grid w-full grid-cols-2 gap-2.5">
              {userStakePending || walletBalanceWei === null ? (
                <InfoStatSkeletonRow count={2} />
              ) : (
                <>
                  <StatCard
                    value={
                      <>
                        {formatTokenAmount(userTotalStakeWei ?? 0n)}{' '}
                        <span className="text-base font-normal text-text-muted">SAFE</span>
                      </>
                    }
                    label="Your stake across validators"
                  />
                  <StatCard
                    value={
                      <>
                        {formatTokenAmount(walletBalanceWei)}{' '}
                        <span className="text-base font-normal text-text-muted">SAFE</span>
                      </>
                    }
                    label="Available to stake"
                  />
                </>
              )}
            </div>
          ) : null}

          <div className="grid w-full grid-cols-3 gap-2 pt-1">
            <Button
              type="button"
              variant="default"
              className="h-10 px-2.5 text-sm font-medium tracking-tight lg:h-11 lg:px-3"
              onClick={handleStake}
            >
              Stake
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-2.5 text-sm font-medium tracking-tight lg:h-11 lg:px-3"
              onClick={handleUnstake}
            >
              Unstake
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-2.5 text-sm font-medium tracking-tight lg:h-11 lg:px-3"
              onClick={handleClaimRewards}
            >
              Claim rewards
            </Button>
          </div>

          {/* <div className="pt-1">
            <a href="#" className="eyebrow font-medium transition-opacity hover:opacity-80">
              Learn how staking works
            </a>
          </div> */}
        </div>
      </section>

    </main>
  )
}
