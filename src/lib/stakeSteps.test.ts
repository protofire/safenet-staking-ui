import { describe, expect, it } from 'vitest'

import {
  approvalProgressDescription,
  resolveStakeSteps,
  stakeStepTitle,
} from './stakeSteps'

describe('resolveStakeSteps', () => {
  it('hides the stepper when no approval is involved', () => {
    const result = resolveStakeSteps({
      supportsBatching: false,
      needsApproval: false,
      approvedInSession: false,
    })
    expect(result.twoStep).toBe(false)
    expect(result.current).toBe(2)
  })

  it('hides the stepper for wallets that bundle approval and stake', () => {
    const result = resolveStakeSteps({
      supportsBatching: true,
      needsApproval: true,
      approvedInSession: false,
    })
    expect(result.twoStep).toBe(false)
  })

  it('marks approval active and stake upcoming while approval is needed', () => {
    const result = resolveStakeSteps({
      supportsBatching: false,
      needsApproval: true,
      approvedInSession: false,
    })
    expect(result.twoStep).toBe(true)
    expect(result.current).toBe(1)
    expect(result.steps.map((s) => s.state)).toEqual(['active', 'upcoming'])
    expect(result.steps[0]?.hint).toBeUndefined()
  })

  it('marks approval done and stake active after approving in this session', () => {
    const result = resolveStakeSteps({
      supportsBatching: false,
      needsApproval: false,
      approvedInSession: true,
    })
    expect(result.twoStep).toBe(true)
    expect(result.current).toBe(2)
    expect(result.steps.map((s) => s.state)).toEqual(['done', 'active'])
    expect(result.steps[0]?.hint).toBe('Approved')
  })

  it('reopens approval when the amount outgrows the allowance after approving', () => {
    const result = resolveStakeSteps({
      supportsBatching: false,
      needsApproval: true,
      approvedInSession: true,
    })
    expect(result.twoStep).toBe(true)
    expect(result.current).toBe(1)
    expect(result.steps.map((s) => s.state)).toEqual(['active', 'upcoming'])
  })
})

describe('stakeStepTitle', () => {
  it('names each step', () => {
    expect(stakeStepTitle(1)).toBe('Step 1 of 2 · Approve SAFE')
    expect(stakeStepTitle(2)).toBe('Step 2 of 2 · Stake')
  })
})

describe('approvalProgressDescription', () => {
  it('describes an exact approval with the amount', () => {
    expect(approvalProgressDescription('12.5', 'exact')).toBe(
      'Allow the staking contract to use 12.5 SAFE.',
    )
    expect(approvalProgressDescription('', null)).toBe(
      'Allow the staking contract to use 0 SAFE.',
    )
  })

  it('describes an unlimited approval', () => {
    expect(approvalProgressDescription('12.5', 'unlimited')).toBe(
      'Allow the staking contract to use your SAFE without a limit.',
    )
  })
})
