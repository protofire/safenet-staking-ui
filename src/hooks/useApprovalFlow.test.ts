import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useApprovalFlow } from './useApprovalFlow'

const { useTokenAllowance, toastSuccess, toastError } = vi.hoisted(() => ({
  useTokenAllowance: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/hooks/useTokenAllowance', () => ({ useTokenAllowance }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))

const approve = vi.fn()
const approveUnlimited = vi.fn()
const resetApproval = vi.fn()

function mockAllowance(overrides: Record<string, unknown> = {}) {
  useTokenAllowance.mockReturnValue({
    allowance: 10n,
    approve,
    approveUnlimited,
    isSigningApproval: false,
    isConfirmingApproval: false,
    isApproved: false,
    isSafeApprovalQueued: false,
    approvalError: null,
    approvalTxHash: undefined,
    resetApproval,
    ...overrides,
  })
}

function renderFlow(amount = 20n) {
  return renderHook(({ parsedAmount }: { parsedAmount: bigint }) => useApprovalFlow(parsedAmount), {
    initialProps: { parsedAmount: amount },
  })
}

describe('useApprovalFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAllowance()
  })

  describe('needsApproval', () => {
    it('is true when the amount exceeds the allowance', () => {
      expect(renderFlow(11n).result.current.needsApproval).toBe(true)
    })

    it('is false when the allowance covers the amount exactly', () => {
      expect(renderFlow(10n).result.current.needsApproval).toBe(false)
    })

    it('is false for a zero amount', () => {
      mockAllowance({ allowance: 0n })

      expect(renderFlow(0n).result.current.needsApproval).toBe(false)
    })

    it('is false while the allowance is still unknown', () => {
      mockAllowance({ allowance: undefined })

      expect(renderFlow(11n).result.current.needsApproval).toBe(false)
    })
  })

  it.each([
    ['signing', { isSigningApproval: true }],
    ['confirming', { isConfirmingApproval: true }],
    ['queued in Safe', { isSafeApprovalQueued: true }],
  ])('reports pending while %s', (_name, state) => {
    mockAllowance(state)

    expect(renderFlow().result.current.isApprovalPending).toBe(true)
  })

  it('is not pending when idle', () => {
    expect(renderFlow().result.current.isApprovalPending).toBe(false)
  })

  it('approves the exact amount and records the approval type', () => {
    const { result } = renderFlow(20n)

    act(() => result.current.approveExact())

    expect(approve).toHaveBeenCalledWith(20n)
    expect(result.current.approvalType).toBe('exact')
  })

  it('approves an unlimited amount and records the approval type', () => {
    const { result } = renderFlow()

    act(() => result.current.approveUnlimited())

    expect(approveUnlimited).toHaveBeenCalledTimes(1)
    expect(result.current.approvalType).toBe('unlimited')
  })

  it('confirms success, resets the approval tx and marks approval done in this session', async () => {
    const { result, rerender } = renderFlow()
    act(() => result.current.approveExact())

    mockAllowance({ isApproved: true, approvalTxHash: '0xabc' })
    rerender({ parsedAmount: 20n })

    expect(result.current.approvalType).toBeNull()
    expect(toastSuccess).toHaveBeenCalledWith('Approval confirmed', {
      description: 'You can now stake your SAFE tokens.',
      id: '0xabc',
    })
    expect(resetApproval).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.approvedInSession).toBe(true))
  })

  it('omits the toast id when no tx hash is known', () => {
    mockAllowance({ isApproved: true })

    renderFlow()

    expect(toastSuccess).toHaveBeenCalledWith('Approval confirmed', {
      description: 'You can now stake your SAFE tokens.',
    })
  })

  it('shows the formatted error and hides the approval type on failure', () => {
    const { result, rerender } = renderFlow()
    act(() => result.current.approveUnlimited())

    mockAllowance({
      approvalError: Object.assign(new Error('long'), { shortMessage: 'Execution reverted.' }),
    })
    rerender({ parsedAmount: 20n })

    expect(result.current.approvalType).toBeNull()
    expect(toastError).toHaveBeenCalledWith('Approval failed', {
      description: 'Execution reverted.',
    })
    expect(result.current.approvedInSession).toBe(false)
  })

  it('tells the user when the approval is queued in Safe', () => {
    mockAllowance({ isSafeApprovalQueued: true })

    renderFlow()

    expect(toastSuccess).toHaveBeenCalledWith('Transaction queued in Safe', {
      description:
        'Your transaction was sent to Safe Wallet for signing. Return here after it is executed.',
    })
  })

  it('does not toast while idle', () => {
    renderFlow()

    expect(toastSuccess).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()
  })

  it('clears the approval type and session flag on reset', async () => {
    mockAllowance({ isApproved: true })
    const { result, rerender } = renderFlow()
    await waitFor(() => expect(result.current.approvedInSession).toBe(true))

    mockAllowance()
    rerender({ parsedAmount: 20n })
    act(() => result.current.approveExact())
    act(() => result.current.resetApprovalFlow())

    expect(result.current.approvalType).toBeNull()
    expect(result.current.approvedInSession).toBe(false)
  })
})
