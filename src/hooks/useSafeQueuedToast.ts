import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { TX_PROGRESS_COPY } from '@/lib/txProgress'

export function useSafeQueuedToast(isSafeQueued: boolean) {
  const shownRef = useRef(false)

  useEffect(() => {
    if (!isSafeQueued) {
      shownRef.current = false
      return
    }
    if (shownRef.current) return
    shownRef.current = true
    toast.success(TX_PROGRESS_COPY['safe-queued'].title, {
      description: TX_PROGRESS_COPY['safe-queued'].description,
    })
  }, [isSafeQueued])
}
