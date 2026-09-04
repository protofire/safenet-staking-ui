import { useEffect, useRef } from 'react'
import { useAccount, useConnect } from 'wagmi'

export function useSafeAppAutoConnect() {
  const { status } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const pending = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.parent === window) return
    if (status !== 'disconnected') return
    if (pending.current) return

    const safeConnector = connectors.find((c) => c.id === 'safe')
    if (!safeConnector) return

    pending.current = true
    void safeConnector
      .getProvider()
      .catch(() => undefined)
      .then((provider) => {
        if (!provider) {
          pending.current = false
          return
        }
        return connectAsync({ connector: safeConnector })
      })
      .catch(() => {
        pending.current = false
      })
  }, [status, connectors, connectAsync])
}
