/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module '*.md?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_VALIDATOR_INFO_URL?: string
  readonly VITE_MERKLE_DROP_ADDRESS?: string
  readonly VITE_STAKING_CONTRACT_ADDRESS?: string
  readonly VITE_SAFE_TOKEN_ADDRESS?: string
  readonly VITE_FAUCET_CONTRACT_ADDRESS?: string
  readonly VITE_REWARDS_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
