import { useQuery } from '@tanstack/react-query'
import { getAddress, isAddress } from 'viem'
import { z } from 'zod'

import { env } from '@/config/env'

const validatorEntrySchema = z.object({
  address: z.string().refine((a) => isAddress(a), 'Invalid validator address'),
  commission: z.number(),
  is_active: z.boolean(),
  label: z.string(),
  participation_rate_14d: z.number().nullable(),
})

export type ValidatorInfo = {
  address: `0x${string}`
  commission: number
  isActive: boolean
  label: string
  participationRate14d: number | null
}

const responseSchema = z.array(validatorEntrySchema)

function mapEntry(raw: z.infer<typeof validatorEntrySchema>): ValidatorInfo {
  return {
    address: getAddress(raw.address),
    commission: raw.commission,
    isActive: raw.is_active,
    label: raw.label.replace(/[\p{Cc}\p{Cf}]/gu, '').slice(0, 64),
    participationRate14d: raw.participation_rate_14d,
  }
}

function parseValidatorPayload(json: unknown): ValidatorInfo[] {
  const parsed = responseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('Failed to load validators: unexpected data format.')
  }
  return parsed.data.map(mapEntry)
}

async function fetchValidators(url: string): Promise<ValidatorInfo[]> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new Error('Failed to load validators. Check your connection and retry.')
  }
  if (!res.ok) {
    throw new Error(`Failed to load validators (HTTP ${res.status}).`)
  }
  const raw: unknown = await res.json().catch(() => {
    throw new Error('Failed to load validators: response is not valid JSON.')
  })
  return parseValidatorPayload(raw)
}

export function useValidators() {
  const url = env.VITE_VALIDATOR_INFO_URL

  return useQuery({
    queryKey: ['validators', url],
    queryFn: () => fetchValidators(url),
    staleTime: 5 * 60 * 1000,
  })
}
