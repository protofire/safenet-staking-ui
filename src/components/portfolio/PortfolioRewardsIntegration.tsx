import { ClaimRewardsBanner } from '@/components/portfolio/ClaimRewardsBanner'
import { ClaimRewardsDialog } from '@/components/portfolio/ClaimRewardsDialog'
import { Badge } from '@/components/ui/badge'
import {
  usePortfolioRewardsModels,
  type PortfolioRewardsInfoNote,
} from '@/hooks/usePortfolioRewardsModels'

function RewardsInfoNoteContent({ note }: { note: PortfolioRewardsInfoNote }) {
  if (!note) return null
  if (note.kind === 'missing-config') {
    return (
      <p className="text-sm text-text-muted">
        Set <span className="font-mono text-xs text-text">VITE_MERKLE_DROP_ADDRESS</span> and
        restart the dev server to enable reward claims.
      </p>
    )
  }
  if (note.kind === 'proof-error') {
    return <p className="text-sm text-danger">Failed to fetch reward proof.</p>
  }
  return null
}

export function PortfolioRewardsShell({
  model,
  claimOpen,
  setClaimOpen,
  rewardsUiEnabled,
  portfolioEmpty,
}: {
  model: ReturnType<typeof usePortfolioRewardsModels>
  claimOpen: boolean
  setClaimOpen: (v: boolean) => void
  rewardsUiEnabled: boolean
  portfolioEmpty: boolean
}) {
  const { merkleDrop, rewards, rewardsInfoNote } = model

  return (
    <>
      {rewardsInfoNote ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {merkleDrop ? (
              <Badge variant="outline" className="font-mono text-xs tracking-wide uppercase">
                Merkle rewards
              </Badge>
            ) : null}
            <RewardsInfoNoteContent note={rewardsInfoNote} />
          </div>
        </div>
      ) : null}

      <ClaimRewardsBanner
        claimableWei={rewards.claimable}
        rootStale={rewards.rootStale}
        rewardsEnabled={rewardsUiEnabled}
        portfolioEmpty={portfolioEmpty}
        onClaim={() => setClaimOpen(true)}
      />

      {merkleDrop ? (
        <ClaimRewardsDialog
          open={claimOpen}
          onOpenChange={setClaimOpen}
          model={model}
        />
      ) : null}
    </>
  )
}
