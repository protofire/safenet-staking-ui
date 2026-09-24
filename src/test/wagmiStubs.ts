import type { Address } from 'viem'
import { vi } from 'vitest'
import type { Connector, UseAccountReturnType, UseReadContractReturnType } from 'wagmi'
import { sepolia } from 'wagmi/chains'

import { TEST_ACCOUNT } from './fixtures'

type StubAccountOptions = {
  address?: Address
  chainId?: number | undefined
  connectorType?: string
}

export function stubConnectedAccount(options: StubAccountOptions = {}): UseAccountReturnType {
  const { address = TEST_ACCOUNT, connectorType = 'injected' } = options
  const chainId = 'chainId' in options ? options.chainId : sepolia.id
  return {
    address,
    addresses: [address],
    chain: chainId === sepolia.id ? sepolia : undefined,
    chainId,
    connector: { id: connectorType, name: connectorType, type: connectorType } as Connector,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
    isReconnecting: false,
    status: 'connected',
  } as UseAccountReturnType
}

export function stubDisconnectedAccount(): UseAccountReturnType {
  return {
    address: undefined,
    addresses: undefined,
    chain: undefined,
    chainId: undefined,
    connector: undefined,
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    status: 'disconnected',
  }
}

export function stubRead<T>(
  data: T,
  overrides: Partial<UseReadContractReturnType> = {},
): UseReadContractReturnType {
  const loaded = data !== undefined
  return {
    data,
    error: null,
    isError: false,
    isLoading: false,
    isPending: !loaded,
    isSuccess: loaded,
    isFetching: false,
    status: loaded ? 'success' : 'pending',
    fetchStatus: 'idle',
    refetch: vi.fn(),
    ...overrides,
  } as UseReadContractReturnType
}
