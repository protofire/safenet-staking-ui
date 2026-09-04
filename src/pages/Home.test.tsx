import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/providers'

import Home from './Home'

describe('Home', () => {
  it('renders hero and primary stake action', () => {
    render(<Home />, { wrapper: TestProviders })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Stake SAFE\./)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Earn rewards\./)
    expect(screen.getByRole('button', { name: /^Stake$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unstake/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /claim rewards/i })).toBeInTheDocument()
    expect(screen.getByText(/unstaking cooldown/i)).toBeInTheDocument()
    expect(screen.queryByText(/Your stake across validators/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Wallet balance/)).not.toBeInTheDocument()
  })
})
