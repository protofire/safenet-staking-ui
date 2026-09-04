import { QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'

import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SafeAppAutoConnect } from './components/SafeAppAutoConnect'
import { Toaster } from './components/ui/sonner'
import { queryClient } from './config/queryClient'
import { wagmiConfig } from './config/wagmi'
import { isFrameAncestorAllowed, renderFrameBlockedNotice } from './lib/frameGuard'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

if (isFrameAncestorAllowed()) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ErrorBoundary>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <ConnectKitProvider>
                <SafeAppAutoConnect />
                <App />
                <Toaster richColors closeButton />
              </ConnectKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>,
  )
} else {
  renderFrameBlockedNotice(rootElement)
}
