import { QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'
import { useState, type ReactNode } from 'react'

import { createTestQueryClient, TestProviders } from './providers'

export * from '@testing-library/react'
export { createTestQueryClient }

export function QueryWrapper({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createTestQueryClient)
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: TestProviders, ...options })
}

export function renderHookWithProviders<Result, Props>(
  callback: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>,
) {
  return renderHook(callback, { wrapper: TestProviders, ...options })
}

export function renderHookWithQuery<Result, Props>(
  callback: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>,
) {
  return renderHook(callback, { wrapper: QueryWrapper, ...options })
}
