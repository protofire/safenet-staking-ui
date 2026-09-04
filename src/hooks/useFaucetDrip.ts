import { faucetAbi } from '@/abi/faucetAbi'

import { useContractTx, type TxInvalidation } from './useContractTx'

const FAUCET_INVALIDATION: TxInvalidation = {
  functionNames: [
    'balanceOf',
    'cooldown',
    'dripAmount',
    'nextDripAt',
    'lastDrip',
    'poolBalance',
    'token',
  ],
}

export function useFaucetDrip(faucetContractAddress: `0x${string}`) {
  const { write, ...tx } = useContractTx(FAUCET_INVALIDATION)

  function drip() {
    write({
      address: faucetContractAddress,
      abi: faucetAbi,
      functionName: 'drip',
    })
  }

  return { drip, ...tx }
}
