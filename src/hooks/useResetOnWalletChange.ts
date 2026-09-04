import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'

export function useResetOnWalletChange(onChange: () => void) {
  const { address } = useAccount()
  const previousRef = useRef(address)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (previousRef.current === address) return
    previousRef.current = address
    onChangeRef.current()
  }, [address])
}
