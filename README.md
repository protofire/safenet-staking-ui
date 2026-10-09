# Safenet Staking UI

## Goal

Safenet Staking UI by Protofire is an alternative interface for staking SAFE on Safenet. Development was supported by a grant from Safe Foundation (https://forum.safefoundation.org/t/rfp-safenet-beta-staking-ui-call-for-operators/6992).

This is an independent project and not an official Safe product. It uses the same Safenet staking and rewards contracts as the official Safenet Staking app, so on-chain behavior (staking, unstaking, withdrawals, Merkle reward claims) is the same.

## Acknowledgements

Parts of this codebase (staking, rewards and withdrawal hooks and related logic) are derived from the official [Safenet Staking UI](https://github.com/safe-fndn/safenet-staking-ui) by Safe Foundation, licensed under MIT. The original copyright notice is retained in [`LICENSE`](./LICENSE).

## About

Single-page app built with **TypeScript**, **Vite**, and **React** (strict compiler settings, ESM, `react-jsx`). It is a static deployment target for a SAFE-token staking dApp.

Current version: **1.0.0**.

## Pages

| Route | Description |
| ----- | ----------- |
| `/` | Overview and staking stats |
| `/validators` | Validator list with filters; stake / undelegate |
| `/portfolio` | Your delegations and rewards (rewards UI only when `VITE_MERKLE_DROP_ADDRESS` is set) |
| `/withdrawals` | Pending and claimable withdrawals |
| `/faucet` | Test SAFE faucet (only when `VITE_FAUCET_CONTRACT_ADDRESS` is set) |
| `/faq`, `/imprint`, `/terms`, `/privacy`, `/cookies` | FAQ and legal pages |

## Stack

- **TypeScript 6** (strict) · **Vite 7** · **React 19** · pnpm 10 · Node 22 (see [`.nvmrc`](./.nvmrc))
- Tailwind CSS 4 and shadcn/ui (Radix)
- React Router v7 with `HashRouter` (IPFS and path-prefix friendly)
- TanStack Query, wagmi v2, viem v2, ConnectKit, Safe Apps SDK
- Vitest + Testing Library + MSW; Playwright for E2E
- ESLint for linting, [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for formatting

## Getting started

```sh
nvm use
pnpm install
cp .env.example .env
pnpm dev
```

## Environment

Copy [`.env.example`](./.env.example) to `.env` before `pnpm dev` or `pnpm build`. The example is configured for mainnet.

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


## Scripts

| Script               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `pnpm dev`           | Vite dev server                                   |
| `pnpm build`         | Typecheck (project references) + production build |
| `pnpm preview`       | Serve `dist/` locally                             |
| `pnpm typecheck`     | `tsc -b --noEmit`                                 |
| `pnpm lint`          | ESLint, zero warnings                             |
| `pnpm format`        | Format sources with oxfmt                         |
| `pnpm format:check`  | Check formatting without writing                  |
| `pnpm test`          | Vitest (unit/component tests)                     |
| `pnpm test:watch`    | Vitest watch mode                                 |
| `pnpm test:coverage` | Vitest with V8 coverage (report in `coverage/`)   |
| `pnpm test:e2e`      | Playwright (uses `vite preview` via config)       |

## Formatting

Formatting is handled by **oxfmt** (pinned to `0.67.0`), configured in [`.oxfmtrc.json`](./.oxfmtrc.json): 100-column width, no semicolons, single quotes, trailing commas, LF line endings, and sorted imports (builtin → external → internal/relative). Markdown, `e2e/fixtures/`, `public/` and the lockfile are ignored. Run `pnpm format` before committing.

## Supply chain

[`./.npmrc`](./.npmrc) sets a **minimum release age** of 14 days (`minimum-release-age=20160`, in minutes) and **strict peer dependencies**. The `pnpm.onlyBuiltDependencies` field in [`package.json`](./package.json) is an empty list, so dependency install scripts do not run unless you explicitly allow them. `shadcn` is a dev dependency: its CLI adds components, and `src/index.css` imports `shadcn/tailwind.css` (Tailwind variants, accordion keyframes, a `no-scrollbar` utility). Only that compiled CSS ships; no shadcn JavaScript is in the production bundle.

If a dependency legitimately needs an install script (e.g. native addons), use `pnpm approve-builds` and follow pnpm’s prompts to allow-list that package. The only lifecycle script this project defines is `prepare: husky`, which installs the local Git hooks in `.husky/` when you run `pnpm install`. There is no `postinstall` or other install-time script, and nothing runs for consumers of the built app.

## E2E / CI

Playwright is configured at the app root (`playwright.config.ts`) with `testDir: e2e/tests` and a `webServer` hook that builds the app with the env in [`e2e/env.ts`](./e2e/env.ts) and serves it with `pnpm preview`. There is no CI workflow in this repository yet; run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` locally before opening a pull request. The Husky pre-commit hook runs `lint`, `format:check` and `test`.

E2E tests never touch a real wallet or chain. [`e2e/mocks/`](./e2e/mocks) provides an injected EIP-1193 wallet stub, a JSON-RPC mock that decodes `eth_call` (including multicall) against the app's ABIs, and route interception for the validator feed and the reward proofs in [`e2e/fixtures/`](./e2e/fixtures). Nothing in `e2e/` ships in the production bundle.
