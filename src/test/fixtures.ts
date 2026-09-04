import type { Address, Hex } from 'viem'

import type { RewardProof } from '@/hooks/useRewardProof'
import type { ValidatorInfo } from '@/hooks/useValidators'

export const TEST_ACCOUNT: Address = '0x0FAa1250A0cF6988Fa25ba24E06DC85079174264'
export const TEST_VALIDATOR: Address = '0x1111111111111111111111111111111111111111'
export const TEST_MERKLE_ROOT: Hex =
  '0x60f51a93d41a37b20d8fbd055a20514706cdb8480ecc20c5e4bcfee9edbbe3ee'

export const SAFE = 10n ** 18n

export function buildValidator(overrides: Partial<ValidatorInfo> = {}): ValidatorInfo {
  return {
    address: TEST_VALIDATOR,
    commission: 0.05,
    isActive: true,
    label: 'Test Validator',
    participationRate14d: 0.98,
    ...overrides,
  }
}

export function buildRawValidator(overrides: Record<string, unknown> = {}) {
  return {
    address: TEST_VALIDATOR.toLowerCase(),
    commission: 0.05,
    is_active: true,
    label: 'Test Validator',
    participation_rate_14d: 0.98,
    ...overrides,
  }
}

export function buildRewardProof(overrides: Partial<RewardProof> = {}): RewardProof {
  return {
    cumulativeAmount: (5_400n * SAFE).toString(),
    merkleRoot: TEST_MERKLE_ROOT,
    proof: [
      '0xa0de54951be2a108020a79f0d9539680431134f5ac343ec06d73dc97b1189dbd',
      '0xdd64f893278c8fc81923e254cdfba8be723b6f1e262e74877ee86cd104902d3c',
    ],
    ...overrides,
  }
}
