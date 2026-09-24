import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Page } from '@playwright/test'

import { E2E_ENV } from '../env'

const FIXTURES_DIR = fileURLToPath(new URL('../fixtures/', import.meta.url))
const REWARDS_DIR = path.join(FIXTURES_DIR, 'rewards')
const VALIDATORS_FILE = path.join(FIXTURES_DIR, 'validators.json')

export async function installMockFeeds(page: Page) {
  await page.route(E2E_ENV.VITE_VALIDATOR_INFO_URL, (route) =>
    route.fulfill({ path: VALIDATORS_FILE }),
  )

  const rewardsPrefix = `${E2E_ENV.VITE_REWARDS_BASE_URL}/`
  await page.route(`**${rewardsPrefix}**`, (route) => {
    const relative = new URL(route.request().url()).pathname.slice(rewardsPrefix.length)
    const file = path.resolve(REWARDS_DIR, relative)
    if (!file.startsWith(REWARDS_DIR + path.sep) || !existsSync(file)) {
      return route.fulfill({ status: 404, body: '' })
    }
    return route.fulfill({ path: file })
  })
}
