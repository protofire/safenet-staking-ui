import { useModal } from 'connectkit'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConnectWalletPromptProps = {
  variant?: 'card' | 'inline'
  message?: string
  suffixMessage?: string
  className?: string
}

export function ConnectWalletPrompt({
  variant = 'card',
  message = 'Connect a wallet to continue.',
  suffixMessage,
  className,
}: ConnectWalletPromptProps) {
  const { setOpen } = useModal()

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border border-border-faint bg-bg-sunken/50 px-4 py-3 text-sm text-text-muted',
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-text underline-offset-4 hover:underline"
        >
          Connect a wallet
        </button>
        {suffixMessage ? ` ${suffixMessage}` : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center md:py-14',
        className,
      )}
    >
      <p className="text-sm font-semibold text-text">{message}</p>
      <Button type="button" className="mt-6 font-semibold" onClick={() => setOpen(true)}>
        Connect wallet
      </Button>
    </div>
  )
}
