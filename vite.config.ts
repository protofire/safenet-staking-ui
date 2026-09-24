import { readFileSync } from 'node:fs'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

import { getRpcConnectOrigins } from './src/config/rpcFallbacks'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

const WALLETCONNECT_CONNECT_ORIGINS = [
  'wss://relay.walletconnect.com',
  'wss://relay.walletconnect.org',
  'https://relay.walletconnect.com',
  'https://relay.walletconnect.org',
  'https://pulse.walletconnect.org',
  'https://api.web3modal.org',
] as const

const WALLETCONNECT_FRAME_ORIGINS = [
  'https://verify.walletconnect.com',
  'https://verify.walletconnect.org',
] as const

function originOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function buildCsp(env: Record<string, string>, dev: boolean): string {
  const connectSrc = new Set(["'self'", ...WALLETCONNECT_CONNECT_ORIGINS])
  for (const key of ['VITE_VALIDATOR_INFO_URL', 'VITE_REWARDS_BASE_URL']) {
    const origin = originOf(env[key])
    if (origin) connectSrc.add(origin)
  }
  const chainId = env.VITE_CHAIN_ID
  if (chainId === '1' || chainId === '11155111') {
    for (const origin of getRpcConnectOrigins(chainId, env.VITE_RPC_URL ?? '')) {
      connectSrc.add(origin)
    }
    if (chainId === '11155111') {
      for (const origin of getRpcConnectOrigins('1', 'https://ethereum-rpc.publicnode.com')) {
        connectSrc.add(origin)
      }
    }
  } else {
    const origin = originOf(env.VITE_RPC_URL)
    if (origin) connectSrc.add(origin)
  }
  if (dev) {
    connectSrc.add('ws:')
  }
  return [
    "default-src 'self'",
    dev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${[...connectSrc].join(' ')}`,
    `frame-src 'self' ${WALLETCONNECT_FRAME_ORIGINS.join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join('; ')
}

function cspMetaPlugin(env: Record<string, string>, dev: boolean): Plugin {
  return {
    name: 'csp-meta',
    transformIndexHtml(html) {
      return html.replace('__CSP__', buildCsp(env, dev))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dev = mode === 'development'
  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss(), cspMetaPlugin(env, dev)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
