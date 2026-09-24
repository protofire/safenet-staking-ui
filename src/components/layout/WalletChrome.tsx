import { ConnectWalletButton } from '@/components/layout/ConnectWalletButton'
import { NetworkBadge } from '@/components/layout/NetworkBadge'
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton'
import { WalletEthBalance } from '@/components/layout/WalletEthBalance'
import { WalletSafeBalance } from '@/components/layout/WalletSafeBalance'
import { cn } from '@/lib/utils'

type WalletChromeProps = {
  layout: 'desktop' | 'mobile'
}

function WalletChromeDivider() {
  return <span className="hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden />
}

export function WalletChrome({ layout }: WalletChromeProps) {
  const isDesktop = layout === 'desktop'

  return (
    <div className={cn('flex shrink-0 items-center', isDesktop ? 'gap-3' : 'gap-2')}>
      <div className="flex items-center gap-2">
        <NetworkBadge
          variant={isDesktop ? 'badge' : 'pill'}
          {...(isDesktop ? { className: 'hidden lg:inline-flex' } : {})}
        />
        {isDesktop ? (
          <>
            <WalletEthBalance className="hidden xl:inline-flex" />
            <WalletSafeBalance className="hidden xl:inline-flex" />
          </>
        ) : (
          <>
            <WalletEthBalance className="hidden sm:inline-flex" />
            <WalletSafeBalance className="hidden sm:inline-flex" />
          </>
        )}
      </div>

      <WalletChromeDivider />

      <div className="flex items-center gap-2">
        <ThemeToggleButton className="text-text-muted hover:text-text" />
        <ConnectWalletButton size={isDesktop ? 'default' : 'sm'} showChevron={isDesktop} />
      </div>
    </div>
  )
}
