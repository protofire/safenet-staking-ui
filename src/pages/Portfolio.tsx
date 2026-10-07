import { useModal } from 'connectkit'
import { useNavigate } from 'react-router'

import { ConnectWalletPrompt } from '@/components/layout/ConnectWalletPrompt'
import { PortfolioEmptyState } from '@/components/portfolio/PortfolioEmptyState'
import { PortfolioRewardsShell } from '@/components/portfolio/PortfolioRewardsIntegration'
import { PortfolioStats } from '@/components/portfolio/PortfolioStats'
import { StakeDistributionCard } from '@/components/portfolio/StakeDistributionCard'
import { StakePositionsCard } from '@/components/portfolio/StakePositionsCard'
import { env } from '@/config/env'
import { useClaimFromUrl } from '@/hooks/useClaimFromUrl'
import { usePortfolioPositions } from '@/hooks/usePortfolioPositions'
import { usePortfolioRewardsModels } from '@/hooks/usePortfolioRewardsModels'
import { useWalletReady } from '@/hooks/useWalletReady'
import { formatTokenAmount } from '@/lib/format'

export default function Portfolio() {
  const navigate = useNavigate()
  const { setOpen } = useModal()
  const { isConnected } = useWalletReady()
  const rewardsModel = usePortfolioRewardsModels()
  const rewardsUiEnabled = env.rewardsUiEnabled
  const [claimOpen, setClaimOpen] = useClaimFromUrl(rewardsUiEnabled && !!rewardsModel.merkleDrop)
  const portfolio = usePortfolioPositions(isConnected)
  const { positions, totalStakeWei, loading, stakeOutsideRegistry } = portfolio
  const {
    isError: validatorsError,
    isFetching: validatorsFetching,
    refetch,
  } = portfolio.validatorsQuery

  const rewardsMerkleStatsLoading =
    isConnected && rewardsUiEnabled && !!rewardsModel.merkleDrop && rewardsModel.loading

  const goToValidators = (path: string) => {
    if (!isConnected) {
      setOpen(true)
      return
    }
    navigate(path)
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
                model={rewardsModel}
                claimOpen={claimOpen}
                setClaimOpen={setClaimOpen}
                rewardsUiEnabled={rewardsUiEnabled}
                portfolioEmpty={positions.length === 0}
              />
            ) : null}

            <PortfolioStats
              loading={loading || rewardsMerkleStatsLoading}
              totalStakeWei={totalStakeWei}
              positionsCount={positions.length}
              stakeOutsideRegistry={stakeOutsideRegistry}
              pendingTotalWei={portfolio.pendingTotalWei}
              pendingCount={portfolio.pendingCount}
              pendingCooling={portfolio.pendingCooling}
              rewardsUiEnabled={rewardsUiEnabled}
              rewardsModel={rewardsModel}
            />
          </div>

          {!loading && stakeOutsideRegistry && positions.length > 0 ? (
            <div className="mb-4 rounded-lg border border-dashed border-warning/50 bg-muted/20 px-4 py-3">
              <p className="font-mono text-xs text-warning">
                <span className="font-semibold uppercase tracking-wide">Note</span> — Your total
                stake is higher than the sum in this breakdown (
                <span className="tabular-nums">
                  {totalStakeWei !== undefined ? formatTokenAmount(totalStakeWei) : '—'}
                </span>{' '}
                vs{' '}
                <span className="tabular-nums">
                  {formatTokenAmount(portfolio.distributionTotal)}
                </span>{' '}
                SAFE). Some validators you use may not appear in this list.
              </p>
            </div>
          ) : null}

          {loading ? null : positions.length === 0 ? (
            <PortfolioEmptyState
              stakeOutsideRegistry={stakeOutsideRegistry}
              totalStakeWei={totalStakeWei}
              onBrowse={() => goToValidators('/validators')}
            />
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
              <StakeDistributionCard positions={positions} total={portfolio.distributionTotal} />
              <StakePositionsCard
                positions={positions}
                onUnstake={(address) => goToValidators(`/validators?undelegate=${address}`)}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}
