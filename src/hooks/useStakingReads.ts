import { useReadContract, useAccount, useReadContracts } from 'wagmi'
import type { Address } from 'viem'

import { stakingAbi } from '@/abi/stakingAbi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

const POLL_INTERVAL = 30_000 as const

const staking = getContractAddresses(chain.id).staking

export function useWithdrawDelay() {
  return useReadContract({
    address: staking,
    abi: stakingAbi,
    functionName: 'withdrawDelay',
    chainId: chain.id,
    query: { refetchInterval: POLL_INTERVAL },
  })
}

export function useUserTotalStake() {
  const { address } = useAccount()
  return useReadContract({
    address: staking,
    abi: stakingAbi,
    functionName: 'totalStakerStakes',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: !!address, refetchInterval: POLL_INTERVAL },
  })
}

export function useUserStakeOnValidator(validator: Address) {
  const { address } = useAccount()
  return useReadContract({
    address: staking,
    abi: stakingAbi,
    functionName: 'stakes',
    args: address ? [address, validator] : undefined,
    chainId: chain.id,
    query: { enabled: !!address, refetchInterval: POLL_INTERVAL },
  })
}

export function useUserStakesOnValidators(validators: Address[]) {
  const { address } = useAccount()
  return useReadContracts({
    contracts: validators.map((v) => ({
      address: staking,
      abi: stakingAbi,
      functionName: 'stakes' as const,
      args: address ? ([address, v] as const) : undefined,
      chainId: chain.id,
    })),
    query: { enabled: !!address && validators.length > 0, refetchInterval: POLL_INTERVAL },
  })
}

export function useValidatorTotalStakes(validators: Address[]) {
  return useReadContracts({
    contracts: validators.map((v) => ({
      address: staking,
      abi: stakingAbi,
      functionName: 'totalValidatorStakes' as const,
      args: [v],
      chainId: chain.id,
    })),
    query: { enabled: validators.length > 0, refetchInterval: POLL_INTERVAL },
  })
}
