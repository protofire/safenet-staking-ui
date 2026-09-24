import { describe, expect, it } from 'vitest'

import { resolveTxProgressPhase, txProgressTitle } from './txProgress'

describe('resolveTxProgressPhase', () => {
  it('prefers success over every other flag', () => {
    expect(resolveTxProgressPhase({ isSuccess: true, isSafeQueued: true, isSigning: true })).toBe(
      'success',
    )
  })

  it('prefers safe-queued over signing', () => {
    expect(resolveTxProgressPhase({ isSafeQueued: true, isSigning: true })).toBe('safe-queued')
  })

  it('returns signing when only signing', () => {
    expect(resolveTxProgressPhase({ isSigning: true })).toBe('signing')
  })

  it('falls back to confirming', () => {
    expect(resolveTxProgressPhase({})).toBe('confirming')
  })
})

describe('txProgressTitle', () => {
  it.each([
    ['signing', 'Confirm in your wallet'],
    ['confirming', 'Waiting for confirmation'],
    ['safe-queued', 'Transaction queued in Safe'],
    ['success', 'Transaction confirmed'],
  ] as const)('titles the %s phase', (phase, title) => {
    expect(txProgressTitle(phase)).toBe(title)
  })
})
