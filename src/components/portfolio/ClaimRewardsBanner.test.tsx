import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ClaimRewardsBanner, type ClaimRewardsBannerProps } from './ClaimRewardsBanner'
import { SAFE } from '@/test/fixtures'

function renderBanner(overrides: Partial<ClaimRewardsBannerProps> = {}) {
  const onClaim = vi.fn()
  render(
    <ClaimRewardsBanner
      claimableWei={5_000n * SAFE}
      rootStale={false}
      rewardsEnabled
      portfolioEmpty={false}
      onClaim={onClaim}
      {...overrides}
    />,
  )
  return { onClaim }
}

describe('ClaimRewardsBanner', () => {
  it('shows the claimable amount and triggers the claim', () => {
    const { onClaim } = renderBanner()

    expect(screen.getByRole('status')).toHaveTextContent('5,000 SAFE')
    fireEvent.click(screen.getByRole('button', { name: 'Claim' }))
    expect(onClaim).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['rewards are disabled', { rewardsEnabled: false }],
    ['the portfolio is empty', { portfolioEmpty: true }],
    ['nothing is claimable', { claimableWei: 0n }],
    ['the merkle root is stale', { rootStale: true }],
  ])('renders nothing when %s', (_name, overrides) => {
    renderBanner(overrides)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
