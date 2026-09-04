import { Outlet } from 'react-router'

import { AppShell } from './AppShell'

export function AppRouteShell() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
