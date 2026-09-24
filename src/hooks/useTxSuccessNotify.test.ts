import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTxSuccessNotify } from './useTxSuccessNotify'

function setup(initialSuccess: boolean) {
  const onNotify = vi.fn()
  const view = renderHook(
    ({ isSuccess }: { isSuccess: boolean }) => useTxSuccessNotify(isSuccess, onNotify),
    { initialProps: { isSuccess: initialSuccess } },
  )
  return { ...view, onNotify }
}

describe('useTxSuccessNotify', () => {
  it('does nothing until the transaction succeeds', () => {
    const { onNotify } = setup(false)
    expect(onNotify).not.toHaveBeenCalled()
  })

  it('notifies once when success is reached', () => {
    const { onNotify, rerender } = setup(true)

    rerender({ isSuccess: true })
    rerender({ isSuccess: true })

    expect(onNotify).toHaveBeenCalledTimes(1)
  })

  it('re-arms after success resets to false', () => {
    const { rerender, onNotify } = setup(true)

    rerender({ isSuccess: false })
    rerender({ isSuccess: true })

    expect(onNotify).toHaveBeenCalledTimes(2)
  })

  it('uses the latest callback', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ isSuccess, cb }: { isSuccess: boolean; cb: () => void }) =>
        useTxSuccessNotify(isSuccess, cb),
      { initialProps: { isSuccess: false, cb: first } },
    )

    rerender({ isSuccess: false, cb: second })
    rerender({ isSuccess: true, cb: second })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
