import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DialogTxProgress } from './DialogTxProgress'

const TX_HASH = `0x${'ab'.repeat(32)}` as const

function hashLink() {
  return screen.queryByRole('link', { name: `View transaction ${TX_HASH} on block explorer` })
}

describe('DialogTxProgress', () => {
  it('asks the user to sign while signing', () => {
    render(<DialogTxProgress phase="signing" txHash={TX_HASH} />)

    expect(screen.getByText('Confirm in your wallet')).toBeInTheDocument()
    expect(
      screen.getByText('Open your wallet to review and sign the transaction.'),
    ).toBeInTheDocument()
    expect(hashLink()).not.toBeInTheDocument()
  })

  it('shows the hash while confirming', () => {
    render(<DialogTxProgress phase="confirming" txHash={TX_HASH} />)

    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument()
    expect(hashLink()).toBeInTheDocument()
  })

  it('omits the hash while confirming if none is known yet', () => {
    render(<DialogTxProgress phase="confirming" />)

    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument()
    expect(hashLink()).not.toBeInTheDocument()
  })

  it('explains the Safe queue without a hash', () => {
    render(<DialogTxProgress phase="safe-queued" txHash={TX_HASH} />)

    expect(screen.getByText('Transaction queued in Safe')).toBeInTheDocument()
    expect(hashLink()).not.toBeInTheDocument()
  })

  it('shows success with the hash and a custom description', () => {
    render(<DialogTxProgress phase="success" txHash={TX_HASH} description="Staked 5 SAFE." />)

    expect(screen.getByText('Transaction confirmed')).toBeInTheDocument()
    expect(screen.getByText('Staked 5 SAFE.')).toBeInTheDocument()
    expect(screen.queryByText('Your transaction was successful.')).not.toBeInTheDocument()
    expect(hashLink()).toBeInTheDocument()
  })
})
