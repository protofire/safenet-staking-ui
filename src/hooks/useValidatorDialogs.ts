import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAddress, isAddress } from 'viem'

import type { ValidatorInfo } from '@/hooks/useValidators'

type DialogParam = 'delegate' | 'undelegate'

export function useValidatorDialogs({
  validators,
  isConnected,
  onConnectRequired,
}: {
  validators: ValidatorInfo[] | undefined
  isConnected: boolean
  onConnectRequired: () => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const delegateQs = searchParams.get('delegate')
  const undelegateQs = searchParams.get('undelegate')
  const deepStakeCandidate = delegateQs && isAddress(delegateQs) ? getAddress(delegateQs) : null
  const deepUnstakeCandidate =
    !deepStakeCandidate && undelegateQs && isAddress(undelegateQs) ? getAddress(undelegateQs) : null
  const findRegistered = (addr: `0x${string}` | null) =>
    addr ? validators?.find((v) => v.address.toLowerCase() === addr.toLowerCase()) : undefined
  const deepStakeEntry = findRegistered(deepStakeCandidate)
  const deepStakeValidator =
    deepStakeEntry !== undefined && deepStakeEntry.isActive ? deepStakeCandidate : null
  const deepUnstakeValidator =
    findRegistered(deepUnstakeCandidate) !== undefined ? deepUnstakeCandidate : null
  const deepLinkBlocked =
    (delegateQs !== null &&
      (deepStakeCandidate === null || (validators !== undefined && deepStakeValidator === null))) ||
    (delegateQs === null &&
      undelegateQs !== null &&
      (deepUnstakeCandidate === null ||
        (validators !== undefined && deepUnstakeValidator === null)))

  const [manualStakeOpen, setManualStakeOpen] = useState(false)
  const [manualStakeValidator, setManualStakeValidator] = useState<`0x${string}` | null>(null)
  const [manualUnstakeOpen, setManualUnstakeOpen] = useState(false)
  const [manualUnstakeValidator, setManualUnstakeValidator] = useState<`0x${string}` | null>(null)

  const clearParam = useCallback(
    (param: DialogParam) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete(param)
        return next
      })
    },
    [setSearchParams],
  )

  const handleStakeOpenChange = useCallback(
    (open: boolean) => {
      setManualStakeOpen(open)
      if (!open) {
        setManualStakeValidator(null)
        clearParam('delegate')
      }
    },
    [clearParam],
  )

  const handleUnstakeOpenChange = useCallback(
    (open: boolean) => {
      setManualUnstakeOpen(open)
      if (!open) {
        setManualUnstakeValidator(null)
        clearParam('undelegate')
      }
    },
    [clearParam],
  )

  const openDialog = (validatorAddress: string, param: DialogParam) => {
    if (!isConnected) {
      onConnectRequired()
      return
    }
    if (!isAddress(validatorAddress)) return
    const checksum = getAddress(validatorAddress)
    if (param === 'delegate') {
      setManualStakeValidator(checksum)
      setManualStakeOpen(true)
    } else {
      setManualUnstakeValidator(checksum)
      setManualUnstakeOpen(true)
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set(param, checksum)
      next.delete(param === 'delegate' ? 'undelegate' : 'delegate')
      return next
    })
  }

  return {
    deepLinkBlocked,
    stake: {
      validator: deepStakeValidator ?? manualStakeValidator,
      open: deepStakeValidator !== null || manualStakeOpen,
      onOpenChange: handleStakeOpenChange,
    },
    unstake: {
      validator: deepUnstakeValidator ?? manualUnstakeValidator,
      open: deepUnstakeValidator !== null || manualUnstakeOpen,
      onOpenChange: handleUnstakeOpenChange,
    },
    openStake: (validatorAddress: string) => openDialog(validatorAddress, 'delegate'),
    openUnstake: (validatorAddress: string) => openDialog(validatorAddress, 'undelegate'),
  }
}
