import type { Page } from '@playwright/test'
import type { Address } from 'viem'

import { E2E_ENV } from '../env'

type InjectedRequest = { method: string; params?: unknown[] }

const RELAYED_METHODS = [
  'eth_sendTransaction',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_feeHistory',
  'eth_blockNumber',
  'eth_getBlockByNumber',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
]

export async function installMockWallet(
  page: Page,
  { account, chainId }: { account: Address; chainId: number },
) {
  await page.addInitScript(
    ({ account, initialChainIdHex, rpcUrl, relayed }) => {
      let chainIdHex = initialChainIdHex
      const listeners = new Map<string, Set<(payload: unknown) => void>>()
      const emit = (event: string, payload: unknown) => {
        for (const listener of listeners.get(event) ?? []) listener(payload)
      }

      async function relay(method: string, params: unknown[] | undefined) {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params ?? [] }),
        })
        const body = (await response.json()) as {
          result?: unknown
          error?: { code: number; message: string }
        }
        if (body.error) throw Object.assign(new Error(body.error.message), body.error)
        return body.result
      }

      const provider = {
        isMetaMask: true,
        async request({ method, params }: InjectedRequest) {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [account]
            case 'eth_chainId':
              return chainIdHex
            case 'net_version':
              return String(Number.parseInt(chainIdHex, 16))
            case 'wallet_switchEthereumChain': {
              const [{ chainId: next }] = params as [{ chainId: string }]
              chainIdHex = next
              emit('chainChanged', next)
              return null
            }
            case 'wallet_requestPermissions':
            case 'wallet_getPermissions':
              return [{ parentCapability: 'eth_accounts' }]
            default:
              if (relayed.includes(method)) return relay(method, params)
              throw Object.assign(new Error(`Mock wallet does not support ${method}`), {
                code: 4200,
              })
          }
        },
        on(event: string, listener: (payload: unknown) => void) {
          if (!listeners.has(event)) listeners.set(event, new Set())
          listeners.get(event)?.add(listener)
          return provider
        },
        removeListener(event: string, listener: (payload: unknown) => void) {
          listeners.get(event)?.delete(listener)
          return provider
        },
      }
      Object.defineProperty(window, 'ethereum', { value: provider, configurable: true })
      window.localStorage.setItem('wagmi.injected.connected', 'true')
      window.localStorage.setItem('wagmi.recentConnectorId', '"injected"')
    },
    {
      account,
      initialChainIdHex: `0x${chainId.toString(16)}`,
      rpcUrl: E2E_ENV.VITE_RPC_URL,
      relayed: RELAYED_METHODS,
    },
  )
}
