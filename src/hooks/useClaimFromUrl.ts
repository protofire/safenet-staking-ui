import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

export function useClaimFromUrl(eligible: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const claimParam = searchParams.get('claim')
  const wantsClaimFromUrl = claimParam === '1' || claimParam === 'true'
  const [claimOpenState, setClaimOpenState] = useState<'closed' | 'manual' | 'url'>(() =>
    wantsClaimFromUrl ? 'url' : 'closed',
  )

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

  const claimOpen = claimOpenState === 'manual' || (claimOpenState === 'url' && eligible)
  const setClaimOpen = (open: boolean) => setClaimOpenState(open ? 'manual' : 'closed')

  return [claimOpen, setClaimOpen] as const
}
