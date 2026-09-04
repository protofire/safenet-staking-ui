import { useAccount, useReadContract } from 'wagmi'
import { maxUint256 } from 'viem'

import { erc20Abi } from '@/abi/erc20Abi'
import { chain } from '@/config/chains'
import { getContractAddresses } from '@/config/contracts'

import { useContractTx, type TxInvalidation } from './useContractTx'

const ALLOWANCE_INVALIDATION: TxInvalidation = {
  functionNames: ['allowance'],
}

export function useTokenAllowance() {
  const { address } = useAccount()
  const { token, staking } = getContractAddresses(chain.id)

  const allowance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, staking] : undefined,
    chainId: chain.id,
    query: { enabled: !!address },
  })

  const { write, ...tx } = useContractTx(ALLOWANCE_INVALIDATION)

  function approve(amount: bigint) {
    write({
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [staking, amount],
    })
  }

  function approveUnlimited() {
    approve(maxUint256)
  }

  return {
    allowance: typeof allowance.data === 'bigint' ? allowance.data : undefined,
    approve,
    approveUnlimited,
    isSigningApproval: tx.isSigningTx,
    isConfirmingApproval: tx.isConfirmingTx,
    isApproved: tx.isSuccess,
    isSafeApprovalQueued: tx.isSafeQueued,
    approvalError: tx.error,
    approvalTxHash: tx.txHash,
    resetApproval: tx.reset,
  }
}
