import { getDefaultConfig } from 'connectkit'
import { type CreateConfigParameters, createConfig } from 'wagmi'
import { injected, safe, walletConnect } from 'wagmi/connectors'

import { SAFE_ALLOWED_DOMAINS } from '@/lib/safe'

import { getWagmiTransports, wagmiChains } from './chains'
import { env } from './env'

function buildConnectors(): NonNullable<CreateConfigParameters['connectors']> {
  const wc = env.VITE_WALLETCONNECT_PROJECT_ID
  return [
    injected(),
    ...(typeof window !== 'undefined' && window.parent !== window
      ? [
          safe({
            allowedDomains: SAFE_ALLOWED_DOMAINS,
          }),
        ]
      : []),
    ...(wc !== undefined && wc.length > 0
      ? [
          walletConnect({
            projectId: wc,
            showQrModal: false,
            telemetryEnabled: false,
          }),
        ]
      : []),
  ] as NonNullable<CreateConfigParameters['connectors']>
}

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: 'Safenet Staking',
    chains: [...wagmiChains],
    transports: getWagmiTransports(),
    walletConnectProjectId: env.VITE_WALLETCONNECT_PROJECT_ID ?? '',
    enableAaveAccount: false,
    connectors: buildConnectors(),
  }),
)
