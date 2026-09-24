import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }

type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info)
    }
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-center px-6 py-16 text-text"
        >
          <span className="eyebrow">Error</span>
          <h1>Something went wrong</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted lg:text-[0.9375rem]">
            This part of the interface hit an unexpected error. No transaction was sent. You can
            retry, or reload the page if the problem persists.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button type="button" className="font-semibold" onClick={this.reset}>
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
