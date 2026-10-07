import { X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'safenet-beta-banner-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(readDismissed)

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }, [])

  if (dismissed) return null

  return (
    <div
      role="status"
      className="border-b border-brand/25 bg-brand-soft px-3 py-2 text-text shadow-banner dark:border-brand/35"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 lg:px-12">
        <p className="min-w-0 flex-1 text-center text-sm leading-snug sm:text-left">
          <span className="font-semibold text-brand">Note</span>
          {env.faucetUiEnabled
            ? ' — The UI is in testing phase using mock contracts for token, staking and rewards. Click on Faucet to get tokens for testing'
            : ' — The UI is in testing phase currently for internal use.'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('shrink-0 text-text-muted hover:bg-surface-hover hover:text-text')}
          aria-label="Dismiss beta notice"
          onClick={dismiss}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
