import { useReadContract, useAccount } from 'wagmi'

import { erc20Abi } from '@/abi/erc20Abi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

export function useTokenBalance() {
  const { address } = useAccount()
  const { token } = getContractAddresses(chain.id)

  return useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: !!address },
  })
}
