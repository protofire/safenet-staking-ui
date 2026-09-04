import { z } from 'zod'

export function walletConnectProjectIdFromEnv(
  envValue: string | undefined,
): string | undefined {
  const trimmed = envValue?.trim()
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : undefined
}

const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
const ETH_ADDRESS_MESSAGE = 'expected a 40-character hex address after 0x'

const requiredAddressSchema = z.string().trim().regex(ETH_ADDRESS_PATTERN, ETH_ADDRESS_MESSAGE)

const optionalAddressSchema = z
  .preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    requiredAddressSchema.optional(),
  )
  .transform((address) => address ?? '')

const envSchema = z.object({
  VITE_CHAIN_ID: z.union([z.literal('1'), z.literal('11155111')]),
  VITE_RPC_URL: z.string().url(),
  VITE_WALLETCONNECT_PROJECT_ID: z.string().min(1).optional(),
  VITE_VALIDATOR_INFO_URL: z.string().url(),
  VITE_STAKING_CONTRACT_ADDRESS: requiredAddressSchema,
  VITE_SAFE_TOKEN_ADDRESS: requiredAddressSchema,
  VITE_MERKLE_DROP_ADDRESS: optionalAddressSchema,
  VITE_FAUCET_CONTRACT_ADDRESS: optionalAddressSchema,
  VITE_REWARDS_BASE_URL: z.union([z.string(), z.literal('')]).optional(),
})

export type Env = z.infer<typeof envSchema> & {
  rewardsUiEnabled: boolean
  faucetUiEnabled: boolean
}

export function parseEnv(input: Record<string, unknown>): Env {
  const result = envSchema.safeParse(input)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(
      `Invalid environment configuration. Copy .env.example to .env and set the required VITE_* variables.\n${details}`,
    )
  }
  const { VITE_WALLETCONNECT_PROJECT_ID: wcFromEnv, ...parsed } = result.data
  const rewardsUiEnabled = parsed.VITE_MERKLE_DROP_ADDRESS.length > 0
  const faucetUiEnabled = parsed.VITE_FAUCET_CONTRACT_ADDRESS.length > 0
  if (rewardsUiEnabled && (parsed.VITE_REWARDS_BASE_URL?.trim() ?? '').length === 0) {
    throw new Error('VITE_REWARDS_BASE_URL is required when VITE_MERKLE_DROP_ADDRESS is set.')
  }
  return {
    ...parsed,
    VITE_WALLETCONNECT_PROJECT_ID: walletConnectProjectIdFromEnv(wcFromEnv),
    rewardsUiEnabled,
    faucetUiEnabled,
  }
}

export const env = parseEnv({
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  VITE_RPC_URL: import.meta.env.VITE_RPC_URL,
  VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  VITE_VALIDATOR_INFO_URL: import.meta.env.VITE_VALIDATOR_INFO_URL,
  VITE_MERKLE_DROP_ADDRESS: import.meta.env.VITE_MERKLE_DROP_ADDRESS,
  VITE_STAKING_CONTRACT_ADDRESS: import.meta.env.VITE_STAKING_CONTRACT_ADDRESS,
  VITE_SAFE_TOKEN_ADDRESS: import.meta.env.VITE_SAFE_TOKEN_ADDRESS,
  VITE_FAUCET_CONTRACT_ADDRESS: import.meta.env.VITE_FAUCET_CONTRACT_ADDRESS,
  VITE_REWARDS_BASE_URL: import.meta.env.VITE_REWARDS_BASE_URL,
})
