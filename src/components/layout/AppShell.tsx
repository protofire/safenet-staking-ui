import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

import { AppHeader } from './AppHeader'
import { BetaBanner } from './BetaBanner'
import { Footer, FooterBar } from './Footer'
import { MobileTabBar } from './MobileTabBar'
import { MobileTopBar } from './MobileTopBar'
import { WrongNetworkBar } from './WrongNetworkBar'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === ''

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-text">
      <div className="hidden lg:block">
        <AppHeader />
      </div>
      <MobileTopBar />
      <BetaBanner />
      <WrongNetworkBar />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col pb-mobile-tab-bar">{children}</div>
        {isHome ? <Footer /> : <FooterBar />}
      </div>
      <MobileTabBar />
    </div>
  )
}
