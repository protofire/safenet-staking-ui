import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/providers'

import Withdrawals from './Withdrawals'

describe('Withdrawals', () => {
  it('renders queue heading and connect hint when disconnected', () => {
    render(<Withdrawals />, { wrapper: TestProviders })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/withdrawal queue/i)
    expect(screen.getByRole('button', { name: /connect a wallet/i })).toBeInTheDocument()
  })
})
