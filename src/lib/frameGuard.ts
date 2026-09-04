import { SAFE_ALLOWED_DOMAINS } from './safe'

function isAllowedAncestor(origin: string): boolean {
  if (origin === window.location.origin) return true
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  return url.protocol === 'https:' && SAFE_ALLOWED_DOMAINS.some((re) => re.test(url.hostname))
}

export function isFrameAncestorAllowed(): boolean {
  if (window.self === window.top) return true
  const ancestors = window.location.ancestorOrigins
  if (ancestors === undefined || ancestors.length === 0) return true
  return Array.from(ancestors).every(isAllowedAncestor)
}

export function renderFrameBlockedNotice(rootElement: HTMLElement): void {
  rootElement.replaceChildren()
  const notice = document.createElement('p')
  notice.textContent =
    'This app cannot be embedded on this site. Open it directly in your browser or through the Safe app.'
  notice.style.cssText =
    'margin:20vh auto;max-width:32rem;padding:0 1rem;font-family:system-ui,sans-serif;text-align:center;color:#e7e7e7'
  rootElement.appendChild(notice)
}
