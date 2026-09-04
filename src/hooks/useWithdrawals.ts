import { useReadContract, useAccount } from 'wagmi'

import { stakingAbi } from '@/abi/stakingAbi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

const POLL_INTERVAL = 15_000 as const

const staking = getContractAddresses(chain.id).staking

export function useUserPendingWithdrawals() {
  const { address } = useAccount()
  return useReadContract({
    address: staking,
    abi: stakingAbi,
    functionName: 'getPendingWithdrawals',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: !!address, refetchInterval: POLL_INTERVAL },
  })
}
