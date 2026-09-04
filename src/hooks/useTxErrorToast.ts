import { useEffect } from 'react'
import { toast } from 'sonner'

import { formatContractError } from '@/lib/contractErrors'

export function useTxErrorToast(error: unknown, title: string) {
  useEffect(() => {
    if (!error) return
    toast.error(title, { description: formatContractError(error) })
  }, [error, title])
}
