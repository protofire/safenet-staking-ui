import { NavLink } from 'react-router'

import { WalletChrome } from '@/components/layout/WalletChrome'
import { APP_VERSION, LOGO_SRC } from '@/config/app'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text',
    isActive &&
      'text-text after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-primary after:content-[""]',
  )

export function AppHeader() {
  return (
    <header className="border-b border-border-faint bg-bg-sunken">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-5 px-6 lg:gap-8 lg:px-12">
        <div className="flex shrink-0 items-center gap-2">
          <img
            src={LOGO_SRC}
            alt=""
            width={32}
            height={32}
            decoding="async"
            className="size-8 shrink-0"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight text-text">SafeNet Staking UI</span>
            <span className="font-mono text-xs tabular-nums text-text-muted">v{APP_VERSION}</span>
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-2 lg:gap-4" aria-label="Main">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/validators" className={navLinkClass}>
            Validators
          </NavLink>
          <NavLink to="/portfolio" className={navLinkClass}>
            Portfolio
          </NavLink>
          <NavLink to="/withdrawals" className={navLinkClass}>
            Withdrawals
          </NavLink>
          {env.faucetUiEnabled ? (
            <NavLink to="/faucet" className={navLinkClass}>
              Faucet
            </NavLink>
          ) : null}
        </nav>

        <WalletChrome layout="desktop" />
      </div>
    </header>
  )
}
