import type { Page, Route } from '@playwright/test'
import {
  decodeFunctionData,
  encodeAbiParameters,
  keccak256,
  multicall3Abi,
  toHex,
  zeroAddress,
  type Abi,
  type AbiFunction,
  type Address,
  type Hex,
} from 'viem'

import { erc20Abi } from '../../src/abi/erc20Abi'
import { merkleDropAbi } from '../../src/abi/merkleDropAbi'
import { stakingAbi } from '../../src/abi/stakingAbi'
import { RPC_FALLBACKS } from '../../src/config/rpcFallbacks'
import { E2E_ACCOUNT, E2E_ENV, E2E_MERKLE_ROOT, E2E_VALIDATOR } from '../env'

const ABI: Abi = [...stakingAbi, ...merkleDropAbi, ...erc20Abi, ...multicall3Abi]
const SEPOLIA_CHAIN_ID = 11155111
const MAINNET_CHAIN_ID = 1
const BLOCK_NUMBER = 9_000_000n
export const BLOCK_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000))
const SAFE = 10n ** 18n

export type ChainState = {
  account: Address
  validator: Address
  stake: bigint
  totalStaked: bigint
  cumulativeClaimed: bigint
  merkleRoot: Hex
  tokenBalance: bigint
  allowance: bigint
  pendingWithdrawals: { amount: bigint; claimableAt: bigint }[]
  withdrawDelay: bigint
}

export const DEFAULT_CHAIN_STATE: ChainState = {
  account: E2E_ACCOUNT,
  validator: E2E_VALIDATOR,
  stake: 1_000n * SAFE,
  totalStaked: 250_000n * SAFE,
  cumulativeClaimed: 400n * SAFE,
  merkleRoot: E2E_MERKLE_ROOT,
  tokenBalance: 12_345n * SAFE,
  allowance: 0n,
  pendingWithdrawals: [],
  withdrawDelay: 7n * 24n * 60n * 60n,
}

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string | null
  method: string
  params?: unknown[]
}

class RevertError extends Error {}

function sameAddress(a: unknown, b: string): boolean {
  return typeof a === 'string' && a.toLowerCase() === b.toLowerCase()
}

function encodeResult(functionName: string, ...values: unknown[]): Hex {
  const item = ABI.find(
    (entry): entry is AbiFunction => entry.type === 'function' && entry.name === functionName,
  )
  if (!item) throw new RevertError(`unknown function ${functionName}`)
  return encodeAbiParameters(item.outputs, values)
}

function handleCall(data: Hex, state: ChainState): Hex {
  let decoded: ReturnType<typeof decodeFunctionData>
  try {
    decoded = decodeFunctionData({ abi: ABI, data })
  } catch {
    throw new RevertError('unknown selector')
  }
  const fn = decoded.functionName
  const args = (decoded.args ?? []) as readonly unknown[]

  switch (fn) {
    case 'aggregate3': {
      const calls = args[0] as readonly { target: Address; allowFailure: boolean; callData: Hex }[]
      const results = calls.map((call) => {
        try {
          return { success: true, returnData: handleCall(call.callData, state) }
        } catch (err) {
          if (call.allowFailure) return { success: false, returnData: '0x' as Hex }
          throw err
        }
      })
      return encodeResult(fn, results)
    }
    case 'stakes':
      return encodeResult(
        fn,
        sameAddress(args[0], state.account) && sameAddress(args[1], state.validator)
          ? state.stake
          : 0n,
      )
    case 'totalStakerStakes':
      return encodeResult(fn, sameAddress(args[0], state.account) ? state.stake : 0n)
    case 'totalValidatorStakes':
    case 'totalStakedAmount':
      return encodeResult(fn, state.totalStaked)
    case 'withdrawDelay':
      return encodeResult(fn, state.withdrawDelay)
    case 'getPendingWithdrawals':
      return encodeResult(fn, state.pendingWithdrawals)
    case 'cumulativeClaimed':
      return encodeResult(fn, sameAddress(args[0], state.account) ? state.cumulativeClaimed : 0n)
    case 'merkleRoot':
      return encodeResult(fn, state.merkleRoot)
    case 'balanceOf':
      return encodeResult(fn, sameAddress(args[0], state.account) ? state.tokenBalance : 0n)
    case 'allowance':
      return encodeResult(fn, sameAddress(args[0], state.account) ? state.allowance : 0n)
    case 'approve':
      return encodeResult(fn, true)
    case 'stake': {
      const amount = args[1] as bigint
      if (amount === 0n) throw new RevertError('InvalidAmount()')
      if (amount > state.allowance) throw new RevertError('ERC20: insufficient allowance')
      if (amount > state.tokenBalance) throw new RevertError('ERC20: insufficient balance')
      return '0x'
    }
    case 'initiateWithdrawal': {
      if (!sameAddress(args[0], state.validator) || (args[1] as bigint) > state.stake) {
        throw new RevertError('InsufficientStake()')
      }
      return '0x'
    }
    case 'claimWithdrawal':
      if (matureWithdrawalIndex(state) === -1) throw new RevertError('NoClaimableWithdrawal()')
      return '0x'
    case 'decimals':
      return encodeResult(fn, 18)
    case 'symbol':
      return encodeResult(fn, 'SAFE')
    case 'name':
      return encodeResult(fn, 'Safe Token')
    default:
      throw new RevertError(`unmocked function ${fn}`)
  }
}

function matureWithdrawalIndex(state: ChainState): number {
  const head = state.pendingWithdrawals[0]
  return head && head.claimableAt <= BLOCK_TIMESTAMP ? 0 : -1
}

function applyTransaction(data: Hex, state: ChainState) {
  handleCall(data, state)
  const { functionName, args = [] } = decodeFunctionData({ abi: ABI, data })
  const values = args as readonly unknown[]
  switch (functionName) {
    case 'approve':
      state.allowance = values[1] as bigint
      break
    case 'stake': {
      const amount = values[1] as bigint
      state.allowance -= amount
      state.tokenBalance -= amount
      state.stake += amount
      state.totalStaked += amount
      break
    }
    case 'initiateWithdrawal': {
      const amount = values[1] as bigint
      state.stake -= amount
      state.totalStaked -= amount
      state.pendingWithdrawals.push({ amount, claimableAt: BLOCK_TIMESTAMP + state.withdrawDelay })
      break
    }
    case 'claimWithdrawal': {
      const [claimed] = state.pendingWithdrawals.splice(matureWithdrawalIndex(state), 1)
      state.tokenBalance += claimed?.amount ?? 0n
      break
    }
  }
}

type SentTransaction = { hash: Hex; from: Address; to: Address; data: Hex; functionName: string }

function receipt(tx: SentTransaction) {
  return {
    transactionHash: tx.hash,
    transactionIndex: '0x0',
    blockHash: `0x${'11'.repeat(32)}`,
    blockNumber: toHex(BLOCK_NUMBER),
    from: tx.from,
    to: tx.to,
    cumulativeGasUsed: toHex(21_000n),
    gasUsed: toHex(21_000n),
    effectiveGasPrice: toHex(1_000_000_000n),
    contractAddress: null,
    logs: [],
    logsBloom: `0x${'00'.repeat(256)}`,
    status: '0x1',
    type: '0x2',
  }
}

function transaction(tx: SentTransaction) {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    input: tx.data,
    blockHash: `0x${'11'.repeat(32)}`,
    blockNumber: toHex(BLOCK_NUMBER),
    transactionIndex: '0x0',
    nonce: '0x0',
    value: '0x0',
    gas: toHex(21_000n),
    maxFeePerGas: toHex(1_000_000_000n),
    maxPriorityFeePerGas: toHex(1_000_000_000n),
    type: '0x2',
    chainId: toHex(SEPOLIA_CHAIN_ID),
    v: '0x0',
    r: `0x${'00'.repeat(32)}`,
    s: `0x${'00'.repeat(32)}`,
  }
}

function block() {
  const hash32 = (byte: string) => `0x${byte.repeat(32)}`
  return {
    number: toHex(BLOCK_NUMBER),
    hash: hash32('11'),
    parentHash: hash32('22'),
    timestamp: toHex(BLOCK_TIMESTAMP),
    baseFeePerGas: toHex(1_000_000_000n),
    difficulty: '0x0',
    extraData: '0x',
    gasLimit: toHex(30_000_000n),
    gasUsed: toHex(15_000_000n),
    logsBloom: `0x${'00'.repeat(256)}`,
    miner: zeroAddress,
    mixHash: hash32('00'),
    nonce: '0x0000000000000000',
    receiptsRoot: hash32('33'),
    sha3Uncles: hash32('44'),
    size: '0x1000',
    stateRoot: hash32('55'),
    totalDifficulty: '0x0',
    transactions: [],
    transactionsRoot: hash32('66'),
    uncles: [],
  }
}

function handleRequest(
  req: JsonRpcRequest,
  chainId: number,
  state: ChainState,
  sent: SentTransaction[],
) {
  const ok = (result: unknown) => ({ jsonrpc: '2.0', id: req.id, result })
  const fail = (code: number, message: string) => ({
    jsonrpc: '2.0',
    id: req.id,
    error: { code, message },
  })

  switch (req.method) {
    case 'eth_chainId':
      return ok(toHex(chainId))
    case 'net_version':
      return ok(String(chainId))
    case 'eth_blockNumber':
      return ok(toHex(BLOCK_NUMBER))
    case 'eth_getBlockByNumber':
    case 'eth_getBlockByHash':
      return ok(block())
    case 'eth_call': {
      if (chainId !== SEPOLIA_CHAIN_ID) return fail(3, 'execution reverted')
      const { data, input } = (req.params?.[0] ?? {}) as { data?: Hex; input?: Hex }
      try {
        return ok(handleCall(data ?? input ?? '0x', state))
      } catch (err) {
        if (err instanceof RevertError) return fail(3, `execution reverted: ${err.message}`)
        throw err
      }
    }
    case 'eth_sendTransaction': {
      if (chainId !== SEPOLIA_CHAIN_ID) return fail(-32000, 'wrong chain')
      const { from, to, data, input } = (req.params?.[0] ?? {}) as {
        from: Address
        to: Address
        data?: Hex
        input?: Hex
      }
      const calldata = data ?? input ?? '0x'
      try {
        applyTransaction(calldata, state)
      } catch (err) {
        if (err instanceof RevertError) return fail(3, `execution reverted: ${err.message}`)
        throw err
      }
      const hash = keccak256(toHex(`e2e-tx-${sent.length}`))
      const { functionName } = decodeFunctionData({ abi: ABI, data: calldata })
      sent.push({ hash, from, to, data: calldata, functionName })
      return ok(hash)
    }
    case 'eth_getTransactionReceipt':
    case 'eth_getTransactionByHash': {
      const tx = sent.find((entry) => entry.hash === req.params?.[0])
      if (!tx) return ok(null)
      return ok(req.method === 'eth_getTransactionReceipt' ? receipt(tx) : transaction(tx))
    }
    case 'eth_feeHistory':
      return ok({
        oldestBlock: toHex(BLOCK_NUMBER),
        baseFeePerGas: [toHex(1_000_000_000n)],
        gasUsedRatio: [0.5],
        reward: [[toHex(1_000_000_000n)]],
      })
    case 'eth_getBalance':
      return ok(toHex(SAFE))
    case 'eth_gasPrice':
    case 'eth_maxPriorityFeePerGas':
      return ok(toHex(1_000_000_000n))
    case 'eth_estimateGas':
      return ok(toHex(21_000n))
    case 'eth_getTransactionCount':
      return ok('0x0')
    case 'eth_getCode':
      return ok('0x')
    default:
      return fail(-32601, `Method not found: ${req.method}`)
  }
}

function originsOf(urls: readonly string[]): Set<string> {
  return new Set(urls.map((url) => new URL(url).origin))
}

export type MockChain = {
  state: ChainState
  sent: SentTransaction[]
}

export async function installMockRpc(
  page: Page,
  initial: ChainState = DEFAULT_CHAIN_STATE,
): Promise<MockChain> {
  const state: ChainState = {
    ...initial,
    pendingWithdrawals: initial.pendingWithdrawals.map((entry) => ({ ...entry })),
  }
  const sent: SentTransaction[] = []
  const sepoliaOrigins = originsOf([E2E_ENV.VITE_RPC_URL, ...RPC_FALLBACKS['11155111']])
  const mainnetOrigins = originsOf(RPC_FALLBACKS['1'])

  await page.route(
    (url) => sepoliaOrigins.has(url.origin) || mainnetOrigins.has(url.origin),
    async (route: Route) => {
      const origin = new URL(route.request().url()).origin
      const chainId = sepoliaOrigins.has(origin) ? SEPOLIA_CHAIN_ID : MAINNET_CHAIN_ID
      const body = route.request().postDataJSON() as JsonRpcRequest | JsonRpcRequest[] | null
      if (!body) return route.fulfill({ status: 400, body: 'expected a JSON-RPC body' })
      const response = Array.isArray(body)
        ? body.map((req) => handleRequest(req, chainId, state, sent))
        : handleRequest(body, chainId, state, sent)
      return route.fulfill({ json: response })
    },
  )
  return { state, sent }
}
