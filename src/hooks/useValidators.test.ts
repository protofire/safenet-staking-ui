import { HttpResponse, http, type JsonBodyType } from 'msw'
import { describe, expect, it } from 'vitest'

import { useValidators } from './useValidators'
import { env } from '@/config/env'
import { buildRawValidator, TEST_VALIDATOR } from '@/test/fixtures'
import { server } from '@/test/msw'
import { renderHookWithQuery, waitFor } from '@/test/testUtils'

const url = env.VITE_VALIDATOR_INFO_URL

function respondWith(body: JsonBodyType, status = 200) {
  server.use(http.get(url, () => HttpResponse.json(body, { status })))
}

describe('useValidators', () => {
  it('maps the feed payload to checksummed camelCase entries', async () => {
    respondWith([buildRawValidator()])

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      {
        address: TEST_VALIDATOR,
        commission: 0.05,
        isActive: true,
        label: 'Test Validator',
        participationRate14d: 0.98,
      },
    ])
  })

  it('strips control characters and truncates long labels', async () => {
    const zeroWidthSpace = String.fromCharCode(0x200b)
    respondWith([buildRawValidator({ label: `Bad${zeroWidthSpace}Label${'x'.repeat(100)}` })])

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const label = result.current.data?.[0]?.label
    expect(label?.startsWith('BadLabel')).toBe(true)
    expect(label).toHaveLength(64)
  })

  it('rejects a payload with an invalid address', async () => {
    respondWith([buildRawValidator({ address: '0x123' })])

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to load validators: unexpected data format.')
  })

  it('rejects a payload that is not an array', async () => {
    respondWith({ validators: [] })

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('reports HTTP failures with the status code', async () => {
    respondWith(null, 503)

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to load validators (HTTP 503).')
  })

  it('reports non-JSON responses', async () => {
    server.use(http.get(url, () => new HttpResponse('<html></html>', { status: 200 })))

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe(
      'Failed to load validators: response is not valid JSON.',
    )
  })

  it('reports network failures', async () => {
    server.use(http.get(url, () => HttpResponse.error()))

    const { result } = renderHookWithQuery(() => useValidators())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe(
      'Failed to load validators. Check your connection and retry.',
    )
  })
})
