import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { useRewardProof } from './useRewardProof'
import { buildRewardProof, TEST_ACCOUNT } from '@/test/fixtures'
import { server } from '@/test/msw'
import { renderHookWithQuery, waitFor } from '@/test/testUtils'

const PROOF_URL =
  'https://example.com/rewards/proofs/0f/aa/12/50/0x0faa1250a0cf6988fa25ba24e06dc85079174264.json'

function respondWith(body: BodyInit | null, status = 200, contentType = 'application/json') {
  server.use(
    http.get(
      PROOF_URL,
      () => new HttpResponse(body, { status, headers: { 'content-type': contentType } }),
    ),
  )
}

describe('useRewardProof', () => {
  it('fetches the proof from the radix path derived from the address', async () => {
    const proof = buildRewardProof()
    respondWith(JSON.stringify(proof))

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(proof)
  })

  it('accepts a lowercase address', async () => {
    respondWith(JSON.stringify(buildRewardProof()))

    const { result } = renderHookWithQuery(() =>
      useRewardProof(TEST_ACCOUNT.toLowerCase() as typeof TEST_ACCOUNT),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('resolves null when no proof exists for the address', async () => {
    respondWith(null, 404)

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('resolves null when the host serves an HTML fallback page', async () => {
    respondWith('<!doctype html><html></html>', 200, 'text/html')

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('resolves null for an empty body', async () => {
    respondWith('   ')

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('accepts a proof with a null proof array and kyc fields', async () => {
    const proof = buildRewardProof({ proof: null, kyc: true, kycAmount: '123' })
    respondWith(JSON.stringify(proof))

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(proof)
  })

  it.each([
    ['missing cumulativeAmount', { cumulativeAmount: undefined }],
    ['short merkle root', { merkleRoot: '0x1234' }],
    ['malformed proof entry', { proof: ['0xnothex'] }],
    ['non-numeric kycAmount', { kycAmount: '12abc' }],
    ['non-boolean kyc', { kyc: 'yes' }],
  ])('errors on an invalid proof shape: %s', async (_name, overrides) => {
    respondWith(JSON.stringify({ ...buildRewardProof(), ...overrides }))

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.name).toBe('RewardProofFetchError')
  })

  it('errors on malformed JSON', async () => {
    respondWith('{ not json')

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('errors on server failures other than 404', async () => {
    respondWith(null, 500)

    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch without an address', () => {
    const { result } = renderHookWithQuery(() => useRewardProof(undefined))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when disabled', () => {
    const { result } = renderHookWithQuery(() => useRewardProof(TEST_ACCOUNT, false))

    expect(result.current.fetchStatus).toBe('idle')
  })
})
