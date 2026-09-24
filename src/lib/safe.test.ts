import { afterEach, describe, expect, it, vi } from 'vitest'

import { isSafeApp } from './safe'

const { getInfo, MockSdk } = vi.hoisted(() => {
  const getInfo = vi.fn()
  class MockSdk {
    safe = { getInfo }
  }
  return { getInfo, MockSdk }
})

vi.mock('@safe-global/safe-apps-sdk', () => ({
  default: MockSdk,
}))

describe('isSafeApp', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    getInfo.mockReset()
  })

  it('returns false when not in an iframe', async () => {
    await expect(isSafeApp()).resolves.toBe(false)
    expect(getInfo).not.toHaveBeenCalled()
  })

  it('returns true when the SDK resolves safe info', async () => {
    vi.stubGlobal('parent', {})
    getInfo.mockResolvedValue({ safeAddress: '0x' + '1'.repeat(40) })
    await expect(isSafeApp()).resolves.toBe(true)
  })

  it('returns false when the SDK rejects', async () => {
    vi.stubGlobal('parent', {})
    getInfo.mockRejectedValue(new Error('not safe'))
    await expect(isSafeApp()).resolves.toBe(false)
  })
})
