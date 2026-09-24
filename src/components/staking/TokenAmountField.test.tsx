import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TokenAmountField } from './TokenAmountField'
import { SAFE } from '@/test/fixtures'

function setup(props: Partial<Parameters<typeof TokenAmountField>[0]> = {}) {
  const onChange = vi.fn()
  render(
    <TokenAmountField
      inputId="amount"
      hintId="amount-hint"
      value=""
      onChange={onChange}
      hintLabel="Wallet balance"
      hintValue="12.5"
      {...props}
    />,
  )
  return { onChange, input: screen.getByLabelText('Amount') }
}

describe('TokenAmountField', () => {
  it('labels the input and describes it with the hint', () => {
    const { input } = setup()

    expect(input).toHaveAccessibleDescription('Wallet balance: 12.5 SAFE')
    expect(input).toHaveAttribute('inputmode', 'decimal')
  })

  it('shows the value with thousands delimiters', () => {
    const { input } = setup({ value: '1234567.5' })

    expect(input).toHaveValue('1,234,567.5')
  })

  it('emits the typed amount without delimiters', () => {
    const { input, onChange } = setup()

    fireEvent.change(input, { target: { value: '1,234.5' } })

    expect(onChange).toHaveBeenCalledWith('1234.5')
  })

  it.each(['abc', '1.2.3', '-1', '1e5'])('ignores invalid input %j', (value) => {
    const { input, onChange } = setup()

    fireEvent.change(input, { target: { value } })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('allows clearing the field', () => {
    const { input, onChange } = setup({ value: '5' })

    fireEvent.change(input, { target: { value: '' } })

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('fills the full max amount with 18-decimal precision', () => {
    const { onChange } = setup({ maxAmount: 12n * SAFE + 1n })

    fireEvent.click(screen.getByRole('button', { name: 'MAX' }))

    expect(onChange).toHaveBeenCalledWith('12.000000000000000001')
  })

  it('disables MAX without a max amount', () => {
    setup()
    expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled()
  })

  it('disables MAX when maxDisabled is set even with an amount', () => {
    setup({ maxAmount: SAFE, maxDisabled: true })
    expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled()
  })

  it('marks the input invalid and shows the error message', () => {
    const { input } = setup({ invalid: true, errorMessage: 'Insufficient SAFE.' })

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Insufficient SAFE.')).toBeInTheDocument()
  })

  it('shows the empty message', () => {
    setup({ emptyMessage: 'You do not have enough SAFE to stake.' })

    expect(screen.getByText('You do not have enough SAFE to stake.')).toBeInTheDocument()
  })

  it('disables the input', () => {
    const { input } = setup({ disabled: true })

    expect(input).toBeDisabled()
  })
})
