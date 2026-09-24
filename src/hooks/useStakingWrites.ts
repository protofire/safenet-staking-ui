import { encodeFunctionData, type Address } from 'viem'

import { useBatchContractTx, useContractTx, type TxInvalidation } from './useContractTx'
import { useTxSimulation } from './useTxSimulation'
import { erc20Abi } from '@/abi/erc20Abi'
import { stakingAbi } from '@/abi/stakingAbi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

const addresses = getContractAddresses(chain.id)

const STAKING_INVALIDATION: TxInvalidation = {
  functionNames: [
    'totalStakedAmount',
    'totalStakerStakes',
    'stakes',
    'totalValidatorStakes',
    'totalPendingWithdrawals',
    'getPendingWithdrawals',
    'getNextClaimableWithdrawal',
    'balanceOf',
    'allowance',
  ],
  extraKeys: [['validators']],
}

export function useStake() {
  const { write, ...tx } = useContractTx(STAKING_INVALIDATION)

  function stake(validator: Address, amount: bigint) {
    write({
      address: addresses.staking,
      abi: stakingAbi,
      functionName: 'stake',
      args: [validator, amount],
    })
  }

  return { stake, ...tx }
}

export function useInitiateWithdrawal() {
  const { write, ...tx } = useContractTx(STAKING_INVALIDATION)

  function initiateWithdrawal(validator: Address, amount: bigint) {
    write({
      address: addresses.staking,
      abi: stakingAbi,
      functionName: 'initiateWithdrawal',
      args: [validator, amount],
    })
  }

  return { initiateWithdrawal, ...tx }
}

export function useBatchStake() {
  const { sendCalls, ...tx } = useBatchContractTx(STAKING_INVALIDATION)

  function batchApproveAndStake(validator: Address, amount: bigint) {
    sendCalls([
      {
        to: addresses.token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [addresses.staking, amount],
        }),
      },
      {
        to: addresses.staking,
        data: encodeFunctionData({
          abi: stakingAbi,
          functionName: 'stake',
          args: [validator, amount],
        }),
      },
    ])
  }

  return { batchApproveAndStake, ...tx }
}

export function useClaimWithdrawal() {
  const { write, ...tx } = useContractTx(STAKING_INVALIDATION)

  function claimWithdrawal() {
    write({
      address: addresses.staking,
      abi: stakingAbi,
      functionName: 'claimWithdrawal',
    })
  }

  return { claimWithdrawal, ...tx }
}

export function useBatchClaimWithdrawals() {
  const { sendCalls, ...tx } = useBatchContractTx(STAKING_INVALIDATION)

  function batchClaimWithdrawals(claimCount: number) {
    if (claimCount <= 0) return
    sendCalls(
      Array.from({ length: claimCount }, () => ({
        to: addresses.staking,
        data: encodeFunctionData({
          abi: stakingAbi,
          functionName: 'claimWithdrawal',
        }),
      })),
    )
  }

  return { batchClaimWithdrawals, ...tx }
}

export function useStakeSimulation(validator: Address, amount: bigint, enabled: boolean) {
  return useTxSimulation(
    {
      address: addresses.staking,
      abi: stakingAbi,
      functionName: 'stake',
      args: [validator, amount],
    },
    enabled,
  )
}

export function useInitiateWithdrawalSimulation(
  validator: Address,
  amount: bigint,
  enabled: boolean,
) {
  return useTxSimulation(
    {
      address: addresses.staking,
      abi: stakingAbi,
      functionName: 'initiateWithdrawal',
      args: [validator, amount],
    },
    enabled,
  )
}

export function useClaimWithdrawalSimulation(enabled: boolean) {
  return useTxSimulation(
    { address: addresses.staking, abi: stakingAbi, functionName: 'claimWithdrawal' },
    enabled,
  )
}
