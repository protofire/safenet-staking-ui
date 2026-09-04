import { WalletChrome } from '@/components/layout/WalletChrome'
import { cn } from '@/lib/utils'

export function MobileTopBar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'flex min-h-14 items-center gap-2 border-b border-border bg-bg-sunken px-4 py-2.5 lg:hidden',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <img
          src="/logo.svg"
          alt=""
          width={24}
          height={24}
          decoding="async"
          className="size-6 shrink-0"
        />
        <span className="truncate text-sm font-semibold tracking-tight text-text">
          SafeNet Staking
        </span>
      </div>

      <WalletChrome layout="mobile" />
    </header>
  )
}
