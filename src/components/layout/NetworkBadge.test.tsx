import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NetworkBadge } from './NetworkBadge'
import { chain } from '@/config/chains'
import { TEST_ACCOUNT } from '@/test/fixtures'

const { useAccount } = vi.hoisted(() => ({ useAccount: vi.fn() }))

vi.mock('wagmi', () => ({ useAccount }))

describe('NetworkBadge', () => {
  it('shows the deployment chain when the wallet matches', () => {
    useAccount.mockReturnValue({ isConnected: true, address: TEST_ACCOUNT, chainId: chain.id })

    render(<NetworkBadge />)

    expect(screen.getByText(chain.name)).toBeInTheDocument()
  })

  it('names the wallet chain when it differs from the app chain', () => {
    useAccount.mockReturnValue({ isConnected: true, address: TEST_ACCOUNT, chainId: 1 })

    render(<NetworkBadge />)

    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.queryByText('Unknown chain')).not.toBeInTheDocument()
  })

  it('shows a wrong-network label for unrecognised wallet chains', () => {
    useAccount.mockReturnValue({ isConnected: true, address: TEST_ACCOUNT, chainId: 999999 })

    render(<NetworkBadge variant="pill" />)

    expect(screen.getByText('Wrong network')).toBeInTheDocument()
  })
})
