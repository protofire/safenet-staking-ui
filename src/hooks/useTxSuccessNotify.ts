import { useEffect, useRef } from 'react'

export function useTxSuccessNotify(isSuccess: boolean, onNotify: () => void) {
  const handledRef = useRef(false)
  const onNotifyRef = useRef(onNotify)

  useEffect(() => {
    onNotifyRef.current = onNotify
  })

  useEffect(() => {
    if (!isSuccess) {
      handledRef.current = false
      return
    }
    if (handledRef.current) return
    handledRef.current = true
    onNotifyRef.current()
  }, [isSuccess])
}
