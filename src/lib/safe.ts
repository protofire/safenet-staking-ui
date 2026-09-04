import SafeAppsSDK from '@safe-global/safe-apps-sdk'

export const SAFE_ALLOWED_DOMAINS: RegExp[] = [
  /^(?:.+\.)?safe\.global$/,
  /^(?:.+\.)?safe\.protofire\.io$/,
]

export async function isSafeApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (window.parent === window) return false
  const sdk = new SafeAppsSDK({ allowedDomains: SAFE_ALLOWED_DOMAINS })
  try {
    await sdk.safe.getInfo()
    return true
  } catch {
    return false
  }
}
