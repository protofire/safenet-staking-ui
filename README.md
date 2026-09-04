# Safenet Staking UI

Single-page app built with **TypeScript**, **Vite**, and **React** (strict compiler settings, ESM, `react-jsx`). It is a static deployment target for a SAFE-token staking dApp. Contract integration, the full routing map, ABIs, compliance gating, and product branding are intentionally deferred to follow-up work.

## Stack

- **TypeScript** (strict) · **Vite 7** · **React 19** · pnpm
- Tailwind CSS 4 and shadcn/ui (Radix), Recharts via shadcn chart
- React Router v7 with `HashRouter` (IPFS and path-prefix friendly)
- TanStack Query, wagmi v2, viem v2, ConnectKit, Safe Apps SDK
- Vitest + Testing Library + MSW; Playwright for E2E

## Environment

Copy [`.env.example`](./.env.example) to `.env` before `pnpm dev` or `pnpm build`. The example is configured for mainnet. `VITE_CHAIN_ID`, `VITE_RPC_URL`, `VITE_VALIDATOR_INFO_URL`, `VITE_SAFE_TOKEN_ADDRESS` and `VITE_STAKING_CONTRACT_ADDRESS` are required; the app refuses to start when any of them is missing or malformed. The remaining variables disable optional UI when omitted. Only Ethereum mainnet and Sepolia are supported.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VITE_CHAIN_ID` | yes | Chain id: `11155111` (Sepolia) or `1` (mainnet). |
| `VITE_RPC_URL` | yes | Public JSON-RPC URL for the configured chain. |
| `VITE_VALIDATOR_INFO_URL` | yes | JSON feed for the validators list. No built-in fallback — if the feed is unreachable the UI shows a "failed to load validators" error, and staking stays disabled. |
| `VITE_SAFE_TOKEN_ADDRESS` | yes | SAFE token contract on the configured chain. There is no built-in default, so a mainnet build can never silently point at testnet contracts. |
| `VITE_STAKING_CONTRACT_ADDRESS` | yes | Staking contract on the configured chain. No built-in default. |
| `VITE_REWARDS_BASE_URL` | no | Base URL for merkle reward proof files. Required when `VITE_MERKLE_DROP_ADDRESS` is set; there is no built-in fallback. |
| `VITE_MERKLE_DROP_ADDRESS` | no | Merkle drop contract; when set, enables the rewards UI. |
| `VITE_FAUCET_CONTRACT_ADDRESS` | no | Faucet contract (Sepolia only); when set, enables the faucet page. |
| `VITE_WALLETCONNECT_PROJECT_ID` | no | WalletConnect Cloud project id. When unset, WalletConnect wallets are not offered. |

> **Note on `VITE_*` exposure.** Vite inlines every `VITE_*` value into the production JS bundle, so anything you set is shipped to every client that loads the dApp. Only put public, non-secret values here:
>
> - `VITE_RPC_URL` must be a public, keyless RPC endpoint (e.g. [PublicNode](https://publicnode.com/) URLs like `https://ethereum-sepolia-rpc.publicnode.com`). Do **not** paste an Alchemy/Infura/QuickNode URL with an embedded API key — it will be public and quota-stealable. If you need a paid provider, front it with an unauthenticated proxy you rate-limit by origin/IP. Sepolia builds also use `https://ethereum-rpc.publicnode.com` for mainnet ENS reads in the wallet UI. If the configured RPC fails, reads fall back to the public endpoints listed in [`src/config/rpcFallbacks.ts`](./src/config/rpcFallbacks.ts); these are also added to the CSP `connect-src` at build time.
> - `VITE_WALLETCONNECT_PROJECT_ID` is public-by-design (WalletConnect Cloud projects are identified, not authenticated, by this id).

## Scripts

| Script        | Description                                      |
| ------------- | ------------------------------------------------ |
| `pnpm dev`    | Vite dev server                                  |
| `pnpm build`  | Typecheck (project references) + production build |
| `pnpm preview`| Serve `dist/` locally                            |
| `pnpm typecheck` | `tsc --noEmit`                               |
| `pnpm lint`   | ESLint, zero warnings                            |
| `pnpm test`   | Vitest (unit/component tests)                    |
| `pnpm test:watch` | Vitest watch mode                          |
| `pnpm test:e2e` | Playwright (uses `vite preview` via config)   |

## Supply chain

[`./.npmrc`](./.npmrc) sets a **minimum release age** of 14 days (`minimum-release-age=20160`, in minutes) and **strict peer dependencies**. The `pnpm.onlyBuiltDependencies` field in [`package.json`](./package.json) is an empty list, so dependency install scripts do not run unless you explicitly allow them. The `shadcn` CLI is a dev dependency only; nothing from it ships in the production bundle.

If a dependency legitimately needs an install script (e.g. native addons), use `pnpm approve-builds` and follow pnpm’s prompts to allow-list that package. **This project does not define `postinstall`, `prepare`, or other lifecycle scripts** in `package.json`.

## E2E / CI

Playwright is configured at the app root (`playwright.config.ts`) with `testDir: e2e/tests` and a `webServer` hook that builds the app with the env in [`e2e/env.ts`](./e2e/env.ts) and serves it with `pnpm preview`. There is no CI workflow in this repository yet; run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` locally before opening a pull request.

E2E tests never touch a real wallet or chain. [`e2e/mocks/`](./e2e/mocks) provides an injected EIP-1193 wallet stub, a JSON-RPC mock that decodes `eth_call` (including multicall) against the app's ABIs, and route interception for the validator feed and the reward proofs in [`e2e/fixtures/`](./e2e/fixtures). Nothing in `e2e/` ships in the production bundle.
