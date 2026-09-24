import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Withdrawals from './Withdrawals'
import { TestProviders } from '@/test/providers'
import { stubRead } from '@/test/wagmiStubs'

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useBlock: () => ({ data: undefined }),
}))
vi.mock('@/hooks/useStakingReads', () => ({ useWithdrawDelay: () => stubRead(undefined) }))

describe('Withdrawals', () => {
  it('renders queue heading and connect hint when disconnected', () => {
    render(<Withdrawals />, { wrapper: TestProviders })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/withdrawal queue/i)
    expect(screen.getByRole('button', { name: /connect a wallet/i })).toBeInTheDocument()
  })
})
