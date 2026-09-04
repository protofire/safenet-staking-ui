import { useAccount } from 'wagmi'

import { chain } from '@/config/chains'

export function useWalletReady() {
  const { isConnected, address, chainId: walletChainId } = useAccount()
  const wrongNetwork =
    isConnected && walletChainId !== undefined && walletChainId !== chain.id
  const walletReady = isConnected && walletChainId === chain.id

  return {
    isConnected,
    address,
    walletChainId,
    wrongNetwork,
    walletReady,
    expectedChain: chain,
  }
}
