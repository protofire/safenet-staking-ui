import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClaimWithdrawalDialog } from './ClaimWithdrawalDialog'
import { TX_CHECK_COPY } from '@/components/ui/tx-check-notice'
import { SAFE } from '@/test/fixtures'

const { useWalletReady } = vi.hoisted(() => ({ useWalletReady: vi.fn() }))

vi.mock('@/hooks/useWalletReady', () => ({ useWalletReady }))
vi.mock('wagmi', () => ({ useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }) }))

const TX_HASH = `0x${'ab'.repeat(32)}` as const

type Props = ComponentProps<typeof ClaimWithdrawalDialog>

function renderDialog(overrides: Partial<Props> = {}) {
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <ClaimWithdrawalDialog
      open
      onOpenChange={onOpenChange}
      mode="single"
      matureCount={1}
      totalAmountWei={250n * SAFE}
      isSigning={false}
      isConfirming={false}
      onSubmit={onSubmit}
      {...overrides}
    />,
  )
  return { onSubmit, onOpenChange, dialog: screen.getByRole('dialog') }
}

describe('ClaimWithdrawalDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWalletReady.mockReturnValue({
      wrongNetwork: false,
      expectedChain: { id: 11155111, name: 'Sepolia' },
    })
  })

  it('shows the total and submits a single claim', () => {
    const { onSubmit, dialog } = renderDialog()

    expect(within(dialog).getByRole('heading', { name: 'Claim withdrawal' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/Total\s*250\s*SAFE/)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Claim withdrawal' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('labels a batch claim with the count and explains atomic batching', () => {
    const { dialog } = renderDialog({ mode: 'batch', matureCount: 3 })

    expect(within(dialog).getByRole('button', { name: 'Claim 3 withdrawals' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent(/All 3 claims are submitted in one atomic transaction/)
  })

  it('skips the batching note for a batch of one', () => {
    const { dialog } = renderDialog({ mode: 'batch', matureCount: 1 })

    expect(dialog).not.toHaveTextContent(/atomic transaction/)
  })

  it('warns when the simulation predicts a revert', () => {
    const { dialog } = renderDialog({ simulation: { status: 'failed', reason: 'NotMature' } })

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      `${TX_CHECK_COPY.failed}: NotMature.`,
    )
  })

  it('offers a network switch instead of the claim on the wrong network', () => {
    useWalletReady.mockReturnValue({
      wrongNetwork: true,
      expectedChain: { id: 11155111, name: 'Sepolia' },
    })

    const { dialog } = renderDialog()

    expect(within(dialog).getByRole('button', { name: 'Switch to Sepolia' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Claim withdrawal' })).toBeNull()
  })

  it('closes on Escape while idle', () => {
    const { onOpenChange, dialog } = renderDialog()

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('locks dismissal while the wallet prompt is open', () => {
    const { onOpenChange, dialog } = renderDialog({ isSigning: true })

    expect(
      within(dialog).getByRole('heading', { name: 'Confirm in your wallet' }),
    ).toBeInTheDocument()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('shows success with the custom description and closes on Done', () => {
    const { onOpenChange, dialog } = renderDialog({
      showSuccess: true,
      successDescription: 'Claimed 250 SAFE to your wallet.',
      txHash: TX_HASH,
    })

    expect(
      within(dialog).getByRole('heading', { name: 'Transaction confirmed' }),
    ).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Claimed 250 SAFE to your wallet.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
