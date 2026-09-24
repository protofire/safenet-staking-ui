import { describe, expect, it } from 'vitest'

import { parseEnv, walletConnectProjectIdFromEnv } from './env'

describe('walletConnectProjectIdFromEnv', () => {
  it('returns the env value', () => {
    expect(walletConnectProjectIdFromEnv('from-env')).toBe('from-env')
  })

  it('trims env value', () => {
    expect(walletConnectProjectIdFromEnv('  x  ')).toBe('x')
  })

  it('returns undefined when env is missing', () => {
    expect(walletConnectProjectIdFromEnv(undefined)).toBeUndefined()
  })

  it('returns undefined when env is whitespace', () => {
    expect(walletConnectProjectIdFromEnv('   ')).toBeUndefined()
  })
})

const MERKLE_DROP_TEST_ADDRESS = '0x0000000000000000000000000000000000000001'
const FAUCET_TEST_ADDRESS = '0x0000000000000000000000000000000000000002'
const VALIDATOR_INFO_TEST_URL = 'https://example.com/validators.json'
const REWARDS_TEST_URL = 'https://example.com/rewards'
const STAKING_TEST_ADDRESS = '0x5CbF405e2D7eE85D4DD836C9685A02A077Dc6EF9'
const TOKEN_TEST_ADDRESS = '0x039d9841b32f15f36f635e9e1854c831fd974a89'
function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy: Partial<T> = { ...obj }
  delete copy[key]
  return copy as Omit<T, K>
}

const BASE_SEPOLIA_ENV = {
  VITE_CHAIN_ID: '11155111',
  VITE_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
  VITE_VALIDATOR_INFO_URL: VALIDATOR_INFO_TEST_URL,
  VITE_STAKING_CONTRACT_ADDRESS: STAKING_TEST_ADDRESS,
  VITE_SAFE_TOKEN_ADDRESS: TOKEN_TEST_ADDRESS,
} as const

describe('parseEnv', () => {
  it('parses a valid environment', () => {
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_WALLETCONNECT_PROJECT_ID: 'abc',
      }),
    ).toEqual({
      VITE_CHAIN_ID: '11155111',
      VITE_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
      VITE_WALLETCONNECT_PROJECT_ID: 'abc',
      VITE_VALIDATOR_INFO_URL: VALIDATOR_INFO_TEST_URL,
      VITE_REWARDS_BASE_URL: undefined,
      VITE_MERKLE_DROP_ADDRESS: '',
      VITE_STAKING_CONTRACT_ADDRESS: STAKING_TEST_ADDRESS,
      VITE_SAFE_TOKEN_ADDRESS: TOKEN_TEST_ADDRESS,
      VITE_FAUCET_CONTRACT_ADDRESS: '',
      rewardsUiEnabled: false,
      faucetUiEnabled: false,
    })
  })

  it('throws on an invalid VITE_CHAIN_ID', () => {
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_CHAIN_ID: '5' })).toThrow(/VITE_CHAIN_ID/)
  })

  it('throws when VITE_RPC_URL is omitted or not a URL', () => {
    expect(() => parseEnv(omit(BASE_SEPOLIA_ENV, 'VITE_RPC_URL'))).toThrow(/VITE_RPC_URL/)
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_RPC_URL: 'not-a-url' })).toThrow(
      /VITE_RPC_URL/,
    )
  })

  it('throws when VITE_VALIDATOR_INFO_URL is omitted or empty', () => {
    expect(() => parseEnv(omit(BASE_SEPOLIA_ENV, 'VITE_VALIDATOR_INFO_URL'))).toThrow(
      /VITE_VALIDATOR_INFO_URL/,
    )
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_VALIDATOR_INFO_URL: '' })).toThrow(
      /VITE_VALIDATOR_INFO_URL/,
    )
  })

  it('drops a blank VITE_WALLETCONNECT_PROJECT_ID', () => {
    expect(
      parseEnv({ ...BASE_SEPOLIA_ENV, VITE_WALLETCONNECT_PROJECT_ID: '  ' })
        .VITE_WALLETCONNECT_PROJECT_ID,
    ).toBeUndefined()
  })

  it('throws when VITE_STAKING_CONTRACT_ADDRESS is omitted or empty', () => {
    expect(() => parseEnv(omit(BASE_SEPOLIA_ENV, 'VITE_STAKING_CONTRACT_ADDRESS'))).toThrow(
      /VITE_STAKING_CONTRACT_ADDRESS/,
    )
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_STAKING_CONTRACT_ADDRESS: '' })).toThrow(
      /VITE_STAKING_CONTRACT_ADDRESS/,
    )
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_STAKING_CONTRACT_ADDRESS: '   ' })).toThrow(
      /VITE_STAKING_CONTRACT_ADDRESS/,
    )
  })

  it('throws when VITE_SAFE_TOKEN_ADDRESS is omitted or empty', () => {
    expect(() => parseEnv(omit(BASE_SEPOLIA_ENV, 'VITE_SAFE_TOKEN_ADDRESS'))).toThrow(
      /VITE_SAFE_TOKEN_ADDRESS/,
    )
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_SAFE_TOKEN_ADDRESS: '' })).toThrow(
      /VITE_SAFE_TOKEN_ADDRESS/,
    )
  })

  it('throws on a malformed contract address', () => {
    expect(() =>
      parseEnv({ ...BASE_SEPOLIA_ENV, VITE_STAKING_CONTRACT_ADDRESS: '0x1234' }),
    ).toThrow(/VITE_STAKING_CONTRACT_ADDRESS/)
    expect(() =>
      parseEnv({ ...BASE_SEPOLIA_ENV, VITE_SAFE_TOKEN_ADDRESS: 'not-an-address' }),
    ).toThrow(/VITE_SAFE_TOKEN_ADDRESS/)
  })

  it('trims whitespace around contract addresses', () => {
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_STAKING_CONTRACT_ADDRESS: `  ${STAKING_TEST_ADDRESS}  `,
        VITE_SAFE_TOKEN_ADDRESS: ` ${TOKEN_TEST_ADDRESS} `,
      }),
    ).toMatchObject({
      VITE_STAKING_CONTRACT_ADDRESS: STAKING_TEST_ADDRESS,
      VITE_SAFE_TOKEN_ADDRESS: TOKEN_TEST_ADDRESS,
    })
  })

  it('requires contract addresses on mainnet as well', () => {
    expect(() =>
      parseEnv({
        VITE_CHAIN_ID: '1',
        VITE_RPC_URL: 'https://ethereum-rpc.publicnode.com',
        VITE_VALIDATOR_INFO_URL: VALIDATOR_INFO_TEST_URL,
      }),
    ).toThrow(/VITE_STAKING_CONTRACT_ADDRESS/)
  })

  it('enables rewards UI only when VITE_MERKLE_DROP_ADDRESS is set in env', () => {
    expect(parseEnv({ ...BASE_SEPOLIA_ENV }).rewardsUiEnabled).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_MERKLE_DROP_ADDRESS: '',
      }).rewardsUiEnabled,
    ).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_MERKLE_DROP_ADDRESS: '   ',
      }).rewardsUiEnabled,
    ).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_MERKLE_DROP_ADDRESS: MERKLE_DROP_TEST_ADDRESS,
        VITE_REWARDS_BASE_URL: REWARDS_TEST_URL,
      }),
    ).toMatchObject({
      VITE_MERKLE_DROP_ADDRESS: MERKLE_DROP_TEST_ADDRESS,
      rewardsUiEnabled: true,
    })
  })

  it('rejects malformed optional contract addresses', () => {
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_MERKLE_DROP_ADDRESS: '0xabc' })).toThrow(
      /VITE_MERKLE_DROP_ADDRESS/,
    )
    expect(() => parseEnv({ ...BASE_SEPOLIA_ENV, VITE_FAUCET_CONTRACT_ADDRESS: 'nope' })).toThrow(
      /VITE_FAUCET_CONTRACT_ADDRESS/,
    )
  })

  it('requires VITE_REWARDS_BASE_URL when VITE_MERKLE_DROP_ADDRESS is set', () => {
    expect(() =>
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_MERKLE_DROP_ADDRESS: MERKLE_DROP_TEST_ADDRESS,
      }),
    ).toThrow(/VITE_REWARDS_BASE_URL/)
    expect(() =>
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_MERKLE_DROP_ADDRESS: MERKLE_DROP_TEST_ADDRESS,
        VITE_REWARDS_BASE_URL: '   ',
      }),
    ).toThrow(/VITE_REWARDS_BASE_URL/)
  })

  it('enables faucet UI only when VITE_FAUCET_CONTRACT_ADDRESS is set in env', () => {
    expect(parseEnv({ ...BASE_SEPOLIA_ENV }).faucetUiEnabled).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_FAUCET_CONTRACT_ADDRESS: '',
      }).faucetUiEnabled,
    ).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_FAUCET_CONTRACT_ADDRESS: '   ',
      }).faucetUiEnabled,
    ).toBe(false)
    expect(
      parseEnv({
        ...BASE_SEPOLIA_ENV,
        VITE_FAUCET_CONTRACT_ADDRESS: FAUCET_TEST_ADDRESS,
      }),
    ).toMatchObject({
      VITE_FAUCET_CONTRACT_ADDRESS: FAUCET_TEST_ADDRESS,
      faucetUiEnabled: true,
    })
  })
})
