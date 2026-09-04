import { getAddress } from 'viem'
import type { Address, Hex } from 'viem'

import { merkleDropAbi } from '@/abi/merkleDropAbi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

import { useContractTx, type TxInvalidation } from './useContractTx'
import { IDLE_SIMULATION, useTxSimulation } from './useTxSimulation'

const merkleDrop = getContractAddresses(chain.id).merkleDrop

const REWARD_INVALIDATION: TxInvalidation = {
  functionNames: ['cumulativeClaimed', 'balanceOf'],
  extraKeys: [['rewardProof']],
}

export function useClaimRewards() {
  const { write, ...tx } = useContractTx(REWARD_INVALIDATION)

  function claimRewards(
    account: Address,
    cumulativeAmount: bigint,
    expectedMerkleRoot: Hex,
    merkleProof: Hex[],
  ) {
    if (!merkleDrop) return
    const normalizedAccount = getAddress(account)
    write({
      address: merkleDrop,
      abi: merkleDropAbi,
      functionName: 'claim',
      args: [normalizedAccount, cumulativeAmount, expectedMerkleRoot, merkleProof],
    })
  }

  return { claimRewards, ...tx }
}

export type ClaimRewardsArgs = {
  account: Address
  cumulativeAmount: bigint
  expectedMerkleRoot: Hex
  merkleProof: Hex[]
}

export function useClaimRewardsSimulation(args: ClaimRewardsArgs | undefined, enabled: boolean) {
  const simulation = useTxSimulation(
    merkleDrop && args
      ? {
          address: merkleDrop,
          abi: merkleDropAbi,
          functionName: 'claim',
          args: [
            getAddress(args.account),
            args.cumulativeAmount,
            args.expectedMerkleRoot,
            args.merkleProof,
          ],
        }
      : undefined,
    enabled,
  )
  return merkleDrop ? simulation : IDLE_SIMULATION
}
