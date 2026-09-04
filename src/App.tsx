import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'

import { ErrorBoundary } from './components/ErrorBoundary'
import { AppRouteShell } from './components/layout/AppRouteShell'
import { env } from './config/env'

const Home = lazy(() => import('./pages/Home'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Validators = lazy(() => import('./pages/Validators'))
const Withdrawals = lazy(() => import('./pages/Withdrawals'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Faucet = lazy(() => import('./pages/Faucet'))
const Imprint = lazy(() => import('./pages/Imprint'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Cookies = lazy(() => import('./pages/Cookies'))
const FAQ = lazy(() => import('./pages/FAQ'))

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<AppRouteShell />}>
            <Route
              index
              element={
                <ErrorBoundary>
                  <Home />
                </ErrorBoundary>
              }
            />
            <Route
              path="validators"
              element={
                <ErrorBoundary>
                  <Validators />
                </ErrorBoundary>
              }
            />
            <Route
              path="portfolio"
              element={
                <ErrorBoundary>
                  <Portfolio />
                </ErrorBoundary>
              }
            />
            <Route
              path="withdrawals"
              element={
                <ErrorBoundary>
                  <Withdrawals />
                </ErrorBoundary>
              }
            />
            {env.faucetUiEnabled ? (
              <Route
                path="faucet"
                element={
                  <ErrorBoundary>
                    <Faucet />
                  </ErrorBoundary>
                }
              />
            ) : null}
            <Route
              path="imprint"
              element={
                <ErrorBoundary>
                  <Imprint />
                </ErrorBoundary>
              }
            />
            <Route
              path="terms"
              element={
                <ErrorBoundary>
                  <Terms />
                </ErrorBoundary>
              }
            />
            <Route
              path="privacy"
              element={
                <ErrorBoundary>
                  <Privacy />
                </ErrorBoundary>
              }
            />
            <Route
              path="cookies"
              element={
                <ErrorBoundary>
                  <Cookies />
                </ErrorBoundary>
              }
            />
            <Route
              path="faq"
              element={
                <ErrorBoundary>
                  <FAQ />
                </ErrorBoundary>
              }
            />
          </Route>
          <Route
            path="*"
            element={
              <ErrorBoundary>
                <NotFound />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
