import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { ThemeProvider } from 'next-themes'
import { useState, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { WagmiProvider } from 'wagmi'

import { wagmiConfig } from '@/config/wagmi'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function TestProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createTestQueryClient)
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
