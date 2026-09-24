import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = true

function Flaky() {
  if (shouldThrow) throw new Error('boom')
  return <p>recovered</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when nothing throws', () => {
    shouldThrow = false

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('shows the fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('alert')).toHaveTextContent('No transaction was sent')
  })

  it('re-renders the children after Try again', () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('falls back again if the child still throws after Try again', () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('reloads the page from the fallback', () => {
    const reload = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload })
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reload page' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
