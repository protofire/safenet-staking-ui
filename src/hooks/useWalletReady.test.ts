import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useWalletReady } from './useWalletReady'
import { chain } from '@/config/chains'
import { TEST_ACCOUNT } from '@/test/fixtures'
import { stubConnectedAccount, stubDisconnectedAccount } from '@/test/wagmiStubs'

const { useAccount } = vi.hoisted(() => ({ useAccount: vi.fn() }))

vi.mock('wagmi', () => ({ useAccount }))

describe('useWalletReady', () => {
  it('is ready when connected to the configured chain', () => {
    useAccount.mockReturnValue(stubConnectedAccount())

    const { result } = renderHook(() => useWalletReady())

    expect(result.current).toMatchObject({
      walletReady: true,
      wrongNetwork: false,
      address: TEST_ACCOUNT,
      expectedChain: chain,
    })
  })

  it('reports a wrong network when connected elsewhere', () => {
    useAccount.mockReturnValue(stubConnectedAccount({ chainId: 1 }))

    const { result } = renderHook(() => useWalletReady())

    expect(result.current.wrongNetwork).toBe(true)
    expect(result.current.walletReady).toBe(false)
  })

  it('is neither ready nor wrong network while disconnected', () => {
    useAccount.mockReturnValue(stubDisconnectedAccount())

    const { result } = renderHook(() => useWalletReady())

    expect(result.current.wrongNetwork).toBe(false)
    expect(result.current.walletReady).toBe(false)
  })

  it('does not flag wrong network before the wallet reports a chain', () => {
    useAccount.mockReturnValue(stubConnectedAccount({ chainId: undefined }))

    const { result } = renderHook(() => useWalletReady())

    expect(result.current.wrongNetwork).toBe(false)
    expect(result.current.walletReady).toBe(false)
  })
})
