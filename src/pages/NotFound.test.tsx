import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NotFound from './NotFound'
import { TestProviders } from '@/test/providers'

describe('NotFound', () => {
  it('renders its heading', () => {
    render(<NotFound />, { wrapper: TestProviders })

    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
  })
})
