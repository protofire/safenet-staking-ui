import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { env } from '@/config/env'
import { cn } from '@/lib/utils'

export type MobileTabId = 'dashboard' | 'validators' | 'portfolio' | 'withdrawals' | 'faucet'

type TabDef = { id: MobileTabId; label: string; path: string; icon: ReactNode }

const TABS: TabDef[] = [
  {
    id: 'dashboard',
    label: 'Home',
    path: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 12L12 4l9 8M5 10v10h14V10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'validators',
    label: 'Validators',
    path: '/validators',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="6" r="1.4" fill="currentColor" />
        <circle cx="11" cy="12" r="1.4" fill="currentColor" />
        <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 17v2M8 13v4M12 9v8M16 5v12M20 11v6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'withdrawals',
    label: 'Withdrawals',
    path: '/withdrawals',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'faucet',
    label: 'Faucet',
    path: '/faucet',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3c-1.5 4-6 6.5-6 11a6 6 0 1 0 12 0c0-4.5-4.5-7-6-11z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

function tabFromPath(pathname: string): MobileTabId {
  if (pathname.startsWith('/validators')) return 'validators'
  if (pathname.startsWith('/portfolio')) return 'portfolio'
  if (pathname.startsWith('/withdrawals')) return 'withdrawals'
  if (pathname.startsWith('/faucet')) return 'faucet'
  return 'dashboard'
}

export function MobileTabBar({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = tabFromPath(pathname)
  const tabs = TABS.filter((t) => t.id !== 'faucet' || env.faucetUiEnabled)

  return (
    <nav
      role="tablist"
      aria-label="Primary"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 pb-mobile-tab-bar-safe-area',
        'flex w-full flex-row',
        'border-t border-border bg-bg',
        'lg:hidden',
        className,
      )}
    >
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => navigate(t.path)}
            className={cn(
              'relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5',
              'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]',
              on ? 'text-primary' : 'text-text-muted',
            )}
          >
            {on ? <span className="absolute top-0 right-[20%] left-[20%] h-px bg-primary" /> : null}
            {t.icon}
            <span className="font-mono text-4xs tracking-caps uppercase">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
