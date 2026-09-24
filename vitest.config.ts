import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig({ command: 'serve', mode: 'test' }),
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      unstubGlobals: true,
      unstubEnvs: true,
      exclude: ['**/node_modules/**', '**/e2e/**', '**/example/**'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/config/**',
          'src/abi/**',
          'src/**/constants.ts',
          'src/**/types.ts',
          'src/main.tsx',
          'src/**/*.d.ts',
        ],
        reporter: ['text-summary', 'html'],
      },
      env: {
        VITE_CHAIN_ID: '11155111',
        VITE_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
        VITE_VALIDATOR_INFO_URL: 'https://example.com/validators.json',
        VITE_STAKING_CONTRACT_ADDRESS: '0x5CbF405e2D7eE85D4DD836C9685A02A077Dc6EF9',
        VITE_SAFE_TOKEN_ADDRESS: '0x039d9841b32f15f36f635e9e1854c831fd974a89',
        VITE_REWARDS_BASE_URL: 'https://example.com/rewards',
      },
    },
  }),
)
