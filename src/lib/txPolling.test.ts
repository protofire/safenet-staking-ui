import { describe, expect, it } from 'vitest'

import { CALLS_POLL_MAX_INTERVAL_MS, callsPollInterval } from './txPolling'

describe('callsPollInterval', () => {
  it('polls every 2 seconds during the first minute', () => {
    expect(callsPollInterval(0)).toBe(2_000)
    expect(callsPollInterval(59_999)).toBe(2_000)
  })

  it('slows to 5 seconds between one and five minutes', () => {
    expect(callsPollInterval(60_000)).toBe(5_000)
    expect(callsPollInterval(299_999)).toBe(5_000)
  })

  it('settles at the maximum interval after five minutes', () => {
    expect(callsPollInterval(300_000)).toBe(CALLS_POLL_MAX_INTERVAL_MS)
    expect(callsPollInterval(3_600_000)).toBe(CALLS_POLL_MAX_INTERVAL_MS)
  })
})
