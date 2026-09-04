import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { ThemeProvider } from 'next-themes'
import { MemoryRouter } from 'react-router'
import { WagmiProvider } from 'wagmi'

import { wagmiConfig } from '@/config/wagmi'

export function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <MemoryRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectKitProvider>{children}</ConnectKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}
