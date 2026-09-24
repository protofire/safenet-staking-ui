import { describe, expect, it } from 'vitest'

import { TX_PROGRESS_COPY, resolveTxProgressPhase, txProgressTitle } from './txProgress'

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
  it('returns the copy title for each phase', () => {
    for (const phase of Object.keys(TX_PROGRESS_COPY) as (keyof typeof TX_PROGRESS_COPY)[]) {
      expect(txProgressTitle(phase)).toBe(TX_PROGRESS_COPY[phase].title)
    }
  })
})
