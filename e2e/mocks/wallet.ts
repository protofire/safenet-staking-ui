import type { Page } from '@playwright/test'
import type { Address } from 'viem'

type InjectedRequest = { method: string; params?: unknown[] }

export async function installMockWallet(
  page: Page,
  { account, chainId }: { account: Address; chainId: number },
) {
  await page.addInitScript(
    ({ account, chainIdHex }) => {
      const provider = {
        isMetaMask: true,
        async request({ method }: InjectedRequest) {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [account]
            case 'eth_chainId':
              return chainIdHex
            case 'net_version':
              return String(Number.parseInt(chainIdHex, 16))
            case 'wallet_switchEthereumChain':
              return null
            case 'wallet_requestPermissions':
            case 'wallet_getPermissions':
              return [{ parentCapability: 'eth_accounts' }]
            default:
              throw Object.assign(new Error(`Mock wallet does not support ${method}`), {
                code: 4200,
              })
          }
        },
        on() {
          return provider
        },
        removeListener() {
          return provider
        },
      }
      Object.defineProperty(window, 'ethereum', { value: provider, configurable: true })
      window.localStorage.setItem('wagmi.injected.connected', 'true')
      window.localStorage.setItem('wagmi.recentConnectorId', '"injected"')
    },
    { account, chainIdHex: `0x${chainId.toString(16)}` },
  )
}
